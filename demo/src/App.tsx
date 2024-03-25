import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef, Fragment } from 'react'
import { GeoloniaMap } from '@geolonia/embed-react'
import './App.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as LSID from "@geolonia/local-spatial-id-js-sdk"

MapboxDraw.constants.classes.CONTROL_BASE  = 'maplibregl-ctrl' as 'mapboxgl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-' as 'mapboxgl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group' as 'mapboxgl-ctrl-group';

type NSParams = {
  scale: number;
  origin: string;
  originAngle: number;
}

function RenderClickedFeatures({ features }: { features: GeoJSON.Feature[] }) {
  const filteredFeatures = features
    .map((feature) => {
      const properties = feature.properties || {};
      return {
        ...feature,
        id: feature.properties!.id ?? `${properties.kind}-${properties.zfxy}`,
      };
    })
    .filter((f, i, self) => self.findIndex((s) => s.id === f.id) === i);
  filteredFeatures.sort((a, b) => a.id.localeCompare(b.id));
  return (
    <div id='click-info'>
      <ul>
        {filteredFeatures.map((feature) => (
          <li key={feature.id}>
            <h3><code>{feature.properties!.kind}</code></h3>
            <dl>
              {Object.entries(feature.properties || {}).filter(([key]) => key !== 'kind').map(([key, value]) => (<Fragment key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </Fragment>))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [namespaceParams, setNamespaceParams] = useState<NSParams>({
    scale: 100,
    origin: '35.68950097945576,139.69172572944066',
    originAngle: 79,
  });

  const namespace = useMemo(() => {
    const [latitude, longitude] = namespaceParams.origin.split(',').map(Number);
    return new LSID.LocalNamespace({
      scale: namespaceParams.scale,
      origin_latitude: latitude,
      origin_longitude: longitude,
      origin_angle: namespaceParams.originAngle,
    });
  }, [namespaceParams]);

  const currentlyListeningForClickLatLng = useRef(false);
  const [clickedFeatures, setClickedFeatures] = useState<GeoJSON.Feature[]>([]);
  const [localSpaceZoom, setLocalSpaceZoom] = useState(3);

  useLayoutEffect(() => {
    if (!map) return;

    const rootSpace = namespace.space('/0/0/0/0');

    map.addSource('local-namespace', {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [
          // {
          //   "id": "rootSpace",
          //   "type": "Feature",
          //   "properties": {
          //     "kind": "rootSpace",
          //   },
          //   "geometry": rootSpace.toGeoJSON(),
          // }
        ],
      },
    });

    map.addLayer({
      "id": "local-namespace/polygon",
      "type": "fill",
      "source": "local-namespace",
      "layout": {},
      "paint": {
        "fill-color": ["to-color", ["get", "fill-color"], "#088"],
        "fill-opacity": 0.1,
      },
    }, 'oc-label-capital');
    map.addLayer({
      "id": "local-namespace/polygon-outline",
      "type": "line",
      "source": "local-namespace",
      "layout": {},
      "paint": {
        "line-color": "#088",
        "line-width": 2,
      },
    }, 'oc-label-capital');
    map.addLayer({
      "id": "local-namespace/polygon-label",
      "type": "symbol",
      "source": "local-namespace",
      "layout": {
        "text-font": ["Noto Sans Regular"],
        "text-field": "{zfxy}",
        "text-size": 12,
        "text-anchor": "center",
        "text-allow-overlap": true,
      },
      "paint": {
      },
    }, 'oc-label-capital');

    map.fitBounds(rootSpace.toWGS84BBox2D(), {
      padding: 20,
    });

    return () => {
      map.removeLayer('local-namespace/polygon');
      map.removeLayer('local-namespace/polygon-outline');
      map.removeLayer('local-namespace/polygon-label');
      map.removeSource('local-namespace');
    }
  }, [map, namespace]);

  useEffect(() => {
    if (!map) { return; }

    const rootSpace = namespace.space('/0/0/0/0');
    const childrenAtZoom = rootSpace
      .childrenAtZoom(localSpaceZoom)
      .filter((space) => space.zfxy.f === 0);
    const features: GeoJSON.Feature[] = childrenAtZoom.map((space) => ({
      "id": space.zfxyStr,
      "type": "Feature",
      "properties": {
        "kind": `spaceAtZoom-${localSpaceZoom}`,
        "zfxy": space.zfxyStr,
      },
      "geometry": space.toGeoJSON(),
    }));
    const src = map.getSource('local-namespace') as maplibregl.GeoJSONSource;
    src.updateData({
      add: features,
    });

    const updateData = (features: GeoJSON.Feature[]) => {
      // console.log(features);
      // create a new space for each feature
      for (const feature of features) {
        const localSpaceBounds = namespace.boundingSpaceFromGeoJSON(feature.geometry);
        const localSpacesAtZoom = namespace.spacesFromGeoJSON(localSpaceZoom, feature.geometry);

        const features: GeoJSON.Feature[] = [];
        features.push({
          "type": "Feature",
          "id": feature.id + "-bounding-space",
          "properties": {
            "kind": "boundingSpaceForDraw",
            "id": feature.id + "-bounding-space",
            "zfxy": localSpaceBounds.zfxyStr,
            "fill-color": "#f00",
          },
          "geometry": localSpaceBounds.toGeoJSON(),
        });

        const zfxys: string[] = [];
        const polygons: GeoJSON.Polygon[] = [];
        for (const space of localSpacesAtZoom) {
          if (space.zfxy.f !== 0) { continue; }
          zfxys.push(space.zfxyStr);
          polygons.push(space.toGeoJSON());
        }

        features.push({
          "type": "Feature",
          "id": feature.id + "-localSpaces",
          "properties": {
            "kind": `localSpacesForDraw-${localSpaceZoom}`,
            "id": feature.id + "-localSpaces",
            "fill-color": "#0f0",
            "zfxys": zfxys.join(', '),
          },
          "geometry": {
            "type": "MultiPolygon",
            "coordinates": polygons.map((polygon) => polygon.coordinates),
          },
        });

        src.updateData({
          add: features,
        });
      }
    };

    const createDataUpdateEventHandler = (eventName: string) => {
      const handler: maplibregl.Listener = (event: { features: GeoJSON.Feature[]}) => {
        const { features } = event;
        if (eventName === 'draw.delete') {
          src.updateData({
            remove: features.flatMap((feature) => [
              `${feature.id}-bounding-space`,
              `${feature.id}-localSpaces`,
            ]),
          });
        } else {
          updateData(features);
        }
      };
      map.on(eventName, handler);
      return [eventName, handler] as const;
    };

    const handlers = [
      'draw.create',
      'draw.delete',
      'draw.update',
    ].map(createDataUpdateEventHandler);

    return () => {
      for (const [eventName, handler] of handlers) {
        map.off(eventName, handler);
      }

      src.updateData({
        remove: childrenAtZoom.map((space) => space.zfxyStr),
      });
    }
  }, [map, namespace, localSpaceZoom]);

  const mapLoaded = useCallback((map: maplibregl.Map) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)._mainMap = map;
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.addControl(draw as any, 'top-right');

    map.on('load', () => {
      setMap(map);
    });

    map.on('click', (e) => {
      if (currentlyListeningForClickLatLng.current) {
        console.log(e.lngLat);
        setNamespaceParams((prev) => ({...prev, origin: `${e.lngLat.lat},${e.lngLat.lng}`}));
        currentlyListeningForClickLatLng.current = false;
      } else {
        // console.log(e.lngLat);
        const features = map.queryRenderedFeatures(e.point, {})
          .filter((feature) => feature.source === 'local-namespace');
        console.log(features);
        setClickedFeatures(features);
      }
    });
  }, []);

  return (
    <div id='App'>
      <GeoloniaMap
        onLoad={mapLoaded}
        lang='ja'
        lat='35.68952770997265'
        lng='139.6917002413105'
        zoom='13'
        maxZoom='25'
        marker='off'
        mapStyle='geolonia/basic-v1'
      >
        <GeoloniaMap.Control
          position='top-left'
          containerProps={ { className: 'maplibregl-ctrl maplibregl-ctrl-group ' } }
        >
          <div className='map-ctrl-input-form'>
            <h3>ローカル空間設定</h3>
            <form>
              <label>
                <span>基準点緯度軽度</span>
                <input
                  type='text'
                  name='origin'
                  value={namespaceParams.origin}
                  onFocus={() => {currentlyListeningForClickLatLng.current = true}}
                  onChange={(ev) => setNamespaceParams((prev) => ({...prev, origin: ev.target.value}))}
                />
              </label>
              <label>
                <span>角度</span>
                <div className='input-range-wrapper'>
                  <input
                    type='range'
                    name='originAngle'
                    value={namespaceParams.originAngle}
                    min={0}
                    max={360}
                    step={1}
                    list='angle-list'
                    onChange={(ev) => setNamespaceParams((prev) => ({...prev, originAngle: Number(ev.target.value)}))}
                  />
                  <datalist id='angle-list'>
                    <option value='0' label='0°' />
                    <option value='90' label='90°' />
                    <option value='180' label='180°' />
                    <option value='270' label='270°' />
                    <option value='360' label='360°' />
                  </datalist>
                </div>
                {namespaceParams.originAngle}°
              </label>
              <label>
                <span>スケール</span>
                <input
                  type='text'
                  name='scale'
                  value={namespaceParams.scale}
                  onChange={(ev) => setNamespaceParams((prev) => ({...prev, scale: Number(ev.target.value)}))}
                />
              </label>
            </form>
          </div>
        </GeoloniaMap.Control>
        <GeoloniaMap.Control
          position='top-left'
          containerProps={ { className: 'maplibregl-ctrl maplibregl-ctrl-group ' } }
        >
          <div className='map-ctrl-input-form'>
            <h3>空間内分解能</h3>
            <form>
              <label>
                <input
                  type='range'
                  name='internal-zoom'
                  min={0}
                  max={6}
                  step={1}
                  value={localSpaceZoom}
                  onChange={(ev) => setLocalSpaceZoom(Number(ev.target.value))}
                />
                {localSpaceZoom}
              </label>
            </form>
          </div>
        </GeoloniaMap.Control>
        <GeoloniaMap.Control
          position='top-left'
          containerProps={ { className: 'maplibregl-ctrl maplibregl-ctrl-group map-ctrl-click-info' } }
        >
          <div className='map-ctrl-input-form'>
            <h3>詳細情報</h3>
            <RenderClickedFeatures features={clickedFeatures} />
          </div>
        </GeoloniaMap.Control>
      </GeoloniaMap>
    </div>
  )
}

export default App
