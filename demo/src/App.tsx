import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef, Fragment } from "react";
import { GeoloniaMap } from "@geolonia/embed-react";
import "./App.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as LSID from "@geolonia/local-spatial-id-js-sdk";
import { hashCode } from "./tools";

MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl" as "mapboxgl-ctrl";
MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-" as "mapboxgl-ctrl-";
MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group" as "mapboxgl-ctrl-group";

type NSParams = {
  scale: number;
  scaleHeight: number;
  origin: string;
  originAltitude: number;
  originAngle: number;
};

function RenderClickedFeatures({ features }: { features: GeoJSON.Feature[] }) {
  // const filteredFeatures = features
  //   .map((feature) => {
  //     const properties = feature.properties || {};
  //     return {
  //       ...feature,
  //       id: feature.properties!.id ?? `${properties._kind}-${properties.zfxy}`,
  //     };
  //   })
  //   .filter((f, i, self) => self.findIndex(s => s.id === f.id) === i);
  // filteredFeatures.sort((a, b) => a.id.localeCompare(b.id));
  const uniqueFeatureMap = new Map<number, GeoJSON.Feature>();
  for (const feature of features) {
    uniqueFeatureMap.set(feature.id as number, feature);
  }
  const uniqueFeatures = Array.from(uniqueFeatureMap.values());
  return (
    <div id="click-info">
      <ul>
        {uniqueFeatures.map(feature => (
          <li key={feature.id}>
            <h3><code>{feature.properties!._kind}</code></h3>
            <dl>
              {Object.entries(feature.properties || {}).filter(([key]) => key[0] !== "_").map(([key, value]) => (
                <Fragment key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
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
    scale: 150,
    scaleHeight: 300,
    origin: "35.690128926025096,139.69097558834432",
    originAltitude: 0,
    originAngle: -11,
  });

  const namespace = useMemo(() => {
    const [latitude, longitude] = namespaceParams.origin.split(",").map(Number);
    return new LSID.LocalNamespace({
      scale: namespaceParams.scale,
      origin_latitude: latitude,
      origin_longitude: longitude,
      origin_altitude: namespaceParams.originAltitude,
      origin_angle: namespaceParams.originAngle,
    });
  }, [namespaceParams]);

  const currentlyListeningForClickLatLng = useRef(false);
  const [clickedFeatures, setClickedFeatures] = useState<GeoJSON.Feature[]>([]);
  const [currentMode, setCurrentMode] = useState<"global" | "local">("local");
  const [localSpaceZoom, setLocalSpaceZoom] = useState(3);
  const [globalSpaceZoom, setGlobalSpaceZoom] = useState(21);
  const [interestedLocalF, setInterestedLocalF] = useState(0);
  const [voxelHeight, setVoxelHeight] = useState(0);

  useLayoutEffect(() => {
    if (!map) return;

    const rootSpace = namespace.space("/0/0/0/0");

    map.addSource("local-namespace", {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [],
      },
    });

    const INSERT_BEFORE_LAYER_ID = "oc-label-capital";

    map.addLayer({
      "id": "local-namespace/polygon",
      "type": "fill",
      "source": "local-namespace",
      "filter": ["!", ["has", "min_altitude"]],
      "layout": {},
      "paint": {
        "fill-color": [
          "to-color",
          ["get", "fill-color"],
          ["match", ["get", "_kind"], "globalSpace", "#808", "#088"],
          "#088",
        ],
        "fill-opacity": [
          "match",
          ["get", "_selected"],
          "on",
          0.5,
          0.1,
        ],
      },
    }, INSERT_BEFORE_LAYER_ID);
    map.addLayer({
      "id": "local-namespace/polygon-outline",
      "type": "line",
      "source": "local-namespace",
      "layout": {},
      "paint": {
        "line-color": [
          "to-color",
          ["get", "fill-color"],
          ["match", ["get", "_kind"], "globalSpace", "#808", "#088"],
          "#088",
        ],
        "line-width": 2,
      },
    }, INSERT_BEFORE_LAYER_ID);
    map.addLayer({
      "id": "local-namespace/polygon-label",
      "type": "symbol",
      "source": "local-namespace",
      "filter": ["==", ["get", "_lbl"], "on"],
      "layout": {
        "text-font": ["Noto Sans Regular"],
        "text-field": "{zfxy}",
        "text-size": 12,
        "text-anchor": "center",
        "text-allow-overlap": true,
      },
      "paint": {
      },
    }, INSERT_BEFORE_LAYER_ID);

    map.addLayer({
      "id": "local-namespace/polygon-extrusion-local/selected",
      "type": "fill-extrusion",
      "source": "local-namespace",
      "filter": ["all", ["has", "min_altitude"], ["==", ["get", "_selected"], "on"], ["==", ["get", "_kind"], "localSpace"]],
      "layout": {},
      "paint": {
        "fill-extrusion-color": [
          "to-color",
          ["get", "fill-color"],
          ["match", ["get", "_kind"], "globalSpace", "#808", "#088"],
          "#088",
        ],
        "fill-extrusion-opacity": 0.5,
        "fill-extrusion-base": ["get", "min_altitude"],
        "fill-extrusion-height": ["get", "max_altitude"],
      },
    }, INSERT_BEFORE_LAYER_ID);
    map.addLayer({
      "id": "local-namespace/polygon-extrusion-global/selected",
      "type": "fill-extrusion",
      "source": "local-namespace",
      "filter": ["all", ["has", "min_altitude"], ["==", ["get", "_selected"], "on"], ["==", ["get", "_kind"], "globalSpace"]],
      "layout": {},
      "paint": {
        "fill-extrusion-color": [
          "to-color",
          ["get", "fill-color"],
          ["match", ["get", "_kind"], "globalSpace", "#808", "#088"],
          "#088",
        ],
        "fill-extrusion-opacity": 0.5,
        "fill-extrusion-base": ["get", "min_altitude"],
        "fill-extrusion-height": ["get", "max_altitude"],
      },
    }, INSERT_BEFORE_LAYER_ID);
    map.addLayer({
      "id": "local-namespace/polygon-extrusion",
      "type": "fill-extrusion",
      "source": "local-namespace",
      "filter": ["has", "min_altitude"],
      "layout": {},
      "paint": {
        "fill-extrusion-color": [
          "to-color",
          ["get", "fill-color"],
          ["match", ["get", "_kind"], "globalSpace", "#808", "#088"],
          "#088",
        ],
        "fill-extrusion-opacity": 0.2,
        "fill-extrusion-base": ["get", "min_altitude"],
        "fill-extrusion-height": ["get", "max_altitude"],
      },
    }, INSERT_BEFORE_LAYER_ID);

    map.addLayer({
      "id": "local-namespace/building-3d",
      "type": "fill-extrusion",
      "source": "geolonia",
      "source-layer": "building",
      "minzoom": 13,
      "paint": {
        "fill-extrusion-color": "#D7D4D1",
        "fill-extrusion-height": [
          "get",
          "render_height",
        ],
        "fill-extrusion-base": [
          "get",
          "render_min_height",
        ],
        "fill-extrusion-opacity": 0.2,
      },
    }, INSERT_BEFORE_LAYER_ID);

    map.fitBounds(rootSpace.toWGS84BBox2D(), {
      padding: 200,
      duration: 0, // disable animation
    });

    return () => {
      map.removeLayer("local-namespace/building-3d");
      const layerIds = map.getStyle().layers?.filter(l => "source" in l && l.source === "local-namespace").map(l => l.id);
      for (const layerId of layerIds ?? []) {
        map.removeLayer(layerId);
      }
      map.removeSource("local-namespace");
    };
  }, [map, namespace]);

  useEffect(() => {
    if (!map) {
      return;
    }

    let interestedLocalFInRange;
    // 全体範囲の高さが全体範囲の水平よりも大きい場合
    if (namespaceParams.scaleHeight > namespaceParams.scale) {
      // 正方形の切り方で指定できる最大のF値より、任意の高さのボクセルの高さが大きい場合は、現状の local spacial ID SDK では、
      // そのボクセルの高さを超えるF値は指定できないので、正方形の最大の高さを使って拡張する。
      if (Math.floor(namespaceParams.scaleHeight / voxelHeight) - 1 > Math.pow(2, localSpaceZoom) - 1) {
        interestedLocalFInRange = Math.pow(2, localSpaceZoom) - 1;
      } else {
        interestedLocalFInRange = Math.floor(namespaceParams.scaleHeight / voxelHeight) - 1;
      }
    } else {
      interestedLocalFInRange = Math.pow(2, localSpaceZoom) - 1;
    }

    const rootSpace = namespace.space("/0/0/0/0");
    const childrenAtZoom = rootSpace
      .childrenAtZoom(localSpaceZoom)
      .filter(space => space.zfxy.f === interestedLocalFInRange);

    const features: GeoJSON.Feature[] = childrenAtZoom.map((space) => {
      const bbox = space.toWGS84BBox();
      const _voxelHeight = bbox[5] - bbox[2];
      setVoxelHeight(_voxelHeight);
      // min_altitude は f値 x voxelHeight
      // max_altitude は f値 x voxelHeight + voxelHeight
      const min_altitude = interestedLocalF * _voxelHeight;
      const max_altitude = (interestedLocalF * _voxelHeight) + _voxelHeight;

      return {
        "id": hashCode(space.zfxyStr),
        "type": "Feature",
        "properties": {
          "_kind": "localSpace",
          "_lbl": "on",
          "zoom": localSpaceZoom,
          "zfxy": space.zfxyStr,
          "min_altitude": min_altitude,
          "max_altitude": max_altitude,
        },
        "geometry": space.toGeoJSON(),
      };
    });
    const src = map.getSource("local-namespace") as maplibregl.GeoJSONSource;
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
          "id": hashCode(feature.id + "-bounding-space"),
          "properties": {
            "_kind": "boundingSpaceForDraw",
            "_lbl": "on",
            "id": feature.id + "-bounding-space",
            "zfxy": localSpaceBounds.zfxyStr,
            "fill-color": "#f00",
          },
          "geometry": localSpaceBounds.toGeoJSON(),
        });

        const zfxys: string[] = [];
        const polygons: GeoJSON.Polygon[] = [];
        for (const space of localSpacesAtZoom) {
          if (space.zfxy.f !== 0) {
            continue;
          }
          zfxys.push(space.zfxyStr);
          polygons.push(space.toGeoJSON());
        }

        features.push({
          "type": "Feature",
          "id": hashCode(feature.id + "-localSpaces"),
          "properties": {
            "_kind": `localSpacesForDraw-${localSpaceZoom}`,
            "_lbl": "on",
            "id": feature.id + "-localSpaces",
            "fill-color": "#0f0",
            "zfxys": zfxys.join(", "),
          },
          "geometry": {
            "type": "MultiPolygon",
            "coordinates": polygons.map(polygon => polygon.coordinates),
          },
        });

        src.updateData({
          add: features,
        });
      }
    };

    const createDataUpdateEventHandler = (eventName: string) => {
      const handler: maplibregl.Listener = (event: { features: GeoJSON.Feature[] }) => {
        const { features } = event;
        if (eventName === "draw.delete") {
          src.updateData({
            remove: features.flatMap(feature => [
              hashCode(`${feature.id}-bounding-space`),
              hashCode(`${feature.id}-localSpaces`),
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
      "draw.create",
      "draw.delete",
      "draw.update",
    ].map(createDataUpdateEventHandler);

    return () => {
      for (const [eventName, handler] of handlers) {
        map.off(eventName, handler);
      }

      src.updateData({
        remove: childrenAtZoom.map(space => hashCode(space.zfxyStr)),
      });
    };
  }, [map, namespace, localSpaceZoom, interestedLocalF, namespaceParams.scaleHeight, namespaceParams.scale, voxelHeight]);

  const mapLoaded = useCallback((map: maplibregl.Map) => {
    map.setMaxPitch(80);

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
    map.addControl(draw as any, "top-right");

    map.on("load", () => {
      // map.addSource("dem", {
      //   "type": "raster-dem",
      //   "url": "https://tileserver.geolonia.com/gsi-dem/tiles.json?key=YOUR-API-KEY",
      //   "attribution": "<a href=\"https://www.gsi.go.jp/\" target=\"_blank\">&copy; GSI Japan</a>",
      // });
      // map.addSource("terrainDem", {
      //   "type": "raster-dem",
      //   "url": "https://tileserver.geolonia.com/gsi-dem/tiles.json?key=YOUR-API-KEY",
      //   "attribution": "<a href=\"https://www.gsi.go.jp/\" target=\"_blank\">&copy; GSI Japan</a>",
      // });
      // map.setTerrain({ "source": "terrainDem", "exaggeration": 1 });
      // map.addLayer({
      //   "id": "hillshading2",
      //   "source": "dem",
      //   "type": "hillshade",
      //   "maxzoom": 22,
      //   "paint": {
      //     "hillshade-exaggeration": 0.5,
      //     "hillshade-shadow-color": "#000",
      //     "hillshade-highlight-color": "#fff",
      //   },
      // }, "hillshading");
      map.removeLayer("hillshading");

      setMap(map);
    });
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }
    const src = map.getSource("local-namespace") as maplibregl.GeoJSONSource;

    let temporaryIds: number[] = [];
    let selectedIds: number[] = [];

    const clickHandler = (e: maplibregl.MapMouseEvent) => {
      // empty the temporary IDs from the previous click
      src.updateData({
        remove: temporaryIds,
      });
      temporaryIds = [];

      // clear selected IDs
      src.updateData({
        update: selectedIds.map(id => ({
          id,
          removeProperties: ["_selected"],
        })),
      });
      selectedIds = [];

      if (currentlyListeningForClickLatLng.current) {
        console.log(e.lngLat);
        setNamespaceParams(prev => ({ ...prev, origin: `${e.lngLat.lat},${e.lngLat.lng}` }));
        currentlyListeningForClickLatLng.current = false;
        return;
      }

      // console.log(e.lngLat);
      const lookingForKind = currentMode === "local" ? "localSpace" : "globalSpace";
      const filteredFeatures = map.queryRenderedFeatures(e.point, {})
        .filter(feature => (
          feature.source === "local-namespace"
          && feature.properties._kind === lookingForKind
        ));
      const featuresById = new Map(filteredFeatures.map(feature => [feature.id as number, feature]));
      const features = Array.from(featuresById.values());

      const clickedIds = Array.from(featuresById.keys());
      selectedIds = clickedIds;
      console.log("clickedIds", clickedIds);
      src.updateData({
        update: clickedIds.map(id => ({
          id,
          addOrUpdateProperties: [
            { key: "_selected", value: "on" },
          ],
        })),
      });

      if (currentMode === "local") {
        // Generate the global ID for the clicked feature
        const zfxys = new Set(features.map(feature => feature.properties!.zfxy));
        const geojsons: GeoJSON.Feature[] = [];
        for (const zfxy of zfxys) {
          const space = namespace.space(zfxy);
          // const globalId = space.toContainingGlobalSpatialId({ignoreF: true, maxzoom: 25});
          console.time("toGlobalSpatialIds");
          const globalIds = space.toGlobalSpatialIds(globalSpaceZoom);
          console.timeEnd("toGlobalSpatialIds");
          for (const globalId of globalIds) {
            console.log(globalId);
            const featureId = hashCode(`global-${globalId.tilehash}`);
            temporaryIds.push(featureId);
            geojsons.push({
              "type": "Feature",
              "id": featureId,
              "geometry": globalId.toGeoJSON(),
              "properties": {
                "_kind": "globalSpace",
                "_lbl": "off",
                "_selected": "on",
                "zfxy": globalId.zfxyStr,
                "min_altitude": globalId.altMin,
                "max_altitude": globalId.altMax,
              },
            });
            console.log(`${zfxy} => ${globalId.zfxyStr}`);
          }
        }
        src.updateData({
          add: geojsons,
        });
        setClickedFeatures([...features, ...geojsons]);
      } else { // currentMode === global
        const zfxys = new Set(features.map(feature => feature.properties!.zfxy));
        const toSelect: Set<number> = new Set();
        const geojsons: GeoJSON.Feature[] = [];
        for (const zfxy of zfxys) {
          const space = new LSID.GlobalSpatialId.Space(zfxy);
          const localIds = namespace.spacesFromGeoJSON(localSpaceZoom, space.toGeoJSON());
          for (const localId of localIds) {
            if (localId.zfxy.f !== interestedLocalF) {
              continue;
            }
            const featureId = hashCode(localId.zfxyStr);
            toSelect.add(featureId);

            const bbox = localId.toWGS84BBox();
            const _voxelHeight = bbox[5] - bbox[2];
            setVoxelHeight(_voxelHeight);
            // min_altitude は f値 x voxelHeight
            // max_altitude は f値 x voxelHeight + voxelHeight
            const min_altitude = interestedLocalF * _voxelHeight;
            const max_altitude = (interestedLocalF * _voxelHeight) + _voxelHeight;

            // TODO: this needs to be updated to pull from the one true source of truth
            // right now, this is just being set to show selected cells on the sidebar,
            // but the problem is that it could be that the data in `src` is different!!
            // so we should pull data from `src` and put it in the sidebar, not recreate it.
            // FIX ME!!!!
            geojsons.push({
              "type": "Feature",
              "id": featureId,
              "geometry": localId.toGeoJSON(),
              "properties": {
                "_kind": "localSpace",
                "_lbl": "off",
                "zoom": localSpaceZoom,
                "zfxy": localId.zfxyStr,
                "min_altitude": min_altitude,
                "max_altitude": max_altitude,
              },
            });
            console.log(`${zfxy} => ${localId.zfxyStr}`);
          }
        }
        selectedIds.push(...Array.from(toSelect));
        src.updateData({
          update: selectedIds.map(id => ({
            id,
            addOrUpdateProperties: [
              { key: "_selected", value: "on" },
            ],
          })),
        });
        setClickedFeatures([...features, ...geojsons]);
      }
    };
    map.on("click", clickHandler);

    let lastGlobalIds: number[] = [];
    const refreshGlobalIdOverlay = () => {
      if (currentMode === "local") {
        // No need to update the map if we are not in global mode
        return;
      }
      src.updateData({
        remove: lastGlobalIds,
      });
      lastGlobalIds = [];

      const bounds = map.getBounds();
      const globalIds = LSID.GlobalSpatialId.Space.spacesForGeometry({
        "type": "Polygon",
        "coordinates": [[
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getWest(), bounds.getSouth()],
        ]],
      }, globalSpaceZoom);
      const geojsons: GeoJSON.Feature[] = [];
      for (const globalId of globalIds) {
        const featureId = hashCode(`global-${globalId.tilehash}`);
        lastGlobalIds.push(featureId);
        geojsons.push({
          "type": "Feature",
          "id": featureId,
          "geometry": globalId.toGeoJSON(),
          "properties": {
            "_kind": "globalSpace",
            "_lbl": "off",
            "zfxy": globalId.zfxyStr,
          },
        });
      }
      src.updateData({
        add: geojsons,
      });
    };
    map.on("moveend", refreshGlobalIdOverlay);
    refreshGlobalIdOverlay();

    return () => {
      map.off("click", clickHandler);
      map.off("moveend", refreshGlobalIdOverlay);
      src.updateData({
        update: selectedIds.map(id => ({
          id,
          removeProperties: ["_selected"],
        })),
      });
      src.updateData({
        remove: temporaryIds,
      });
      src.updateData({
        remove: lastGlobalIds,
      });
      setClickedFeatures([]);
    };
  }, [map, namespace, globalSpaceZoom, currentMode, localSpaceZoom, interestedLocalF, voxelHeight]);

  return (
    <div id="App">
      <GeoloniaMap
        onLoad={mapLoaded}
        lang="ja"
        lat="35.68952770997265"
        lng="139.6917002413105"
        zoom="13"
        maxZoom="25"
        marker="off"
        mapStyle="geolonia/basic-v1"
      >
        <GeoloniaMap.Control
          position="top-left"
          containerProps={{ className: "maplibregl-ctrl maplibregl-ctrl-group " }}
        >
          <div className="map-ctrl-input-form">
            <h3>ローカル空間設定</h3>
            <form>
              <label>
                <span>基準点緯度経度</span>
                <input
                  type="text"
                  name="origin"
                  value={namespaceParams.origin}
                  onFocus={() => { currentlyListeningForClickLatLng.current = true; }}
                  onChange={ev => setNamespaceParams(prev => ({ ...prev, origin: ev.target.value }))}
                />
              </label>
              <label>
                <span>基準点標高</span>
                <input
                  type="text"
                  name="originAltitude"
                  value={namespaceParams.originAltitude}
                  onChange={ev => setNamespaceParams(prev => ({
                    ...prev,
                    originAltitude: Number(ev.target.value),
                  }))}
                />
              </label>
              <label>
                <span>角度</span>
                <div className="input-range-wrapper">
                  <input
                    type="range"
                    name="originAngle"
                    value={namespaceParams.originAngle}
                    min={-180}
                    max={180}
                    step={1}
                    list="angle-list"
                    onChange={ev => setNamespaceParams(prev => ({ ...prev, originAngle: Number(ev.target.value) }))}
                  />
                  <datalist id="angle-list">
                    <option value="-180" label="-180°" />
                    <option value="-90" label="-90°" />
                    <option value="0" label="0°" />
                    <option value="90" label="90°" />
                    <option value="180" label="180°" />
                  </datalist>
                </div>
                {namespaceParams.originAngle}
                °
              </label>
              <label>
                <span>全体範囲（水平）</span>
                <input
                  type="text"
                  name="scale"
                  value={namespaceParams.scale}
                  onChange={(ev) => {
                    // 全体範囲を変えた時は、F値と ローカルズームをリセット
                    setInterestedLocalF(0);
                    setLocalSpaceZoom(3);
                    setNamespaceParams(prev => ({ ...prev, scale: Number(ev.target.value) }));
                  }}
                />
              </label>
              <label>
                <span>全体範囲（高さ）</span>
                <input
                  type="text"
                  name="height"
                  value={namespaceParams.scaleHeight}
                  onChange={(ev) => {
                    // 全体範囲を変えた時は、F値と ローカルズームをリセット
                    setInterestedLocalF(0);
                    setLocalSpaceZoom(3);
                    setNamespaceParams(prev => ({ ...prev, scaleHeight: Number(ev.target.value) }));
                  }}
                />
              </label>
            </form>
          </div>
        </GeoloniaMap.Control>
        <GeoloniaMap.Control
          position="top-left"
          containerProps={{ className: "maplibregl-ctrl maplibregl-ctrl-group " }}
        >
          <div className="map-ctrl-input-form">
            <form>
              <label>
                モード:
                {" "}
                <select value={currentMode} onChange={ev => setCurrentMode(ev.currentTarget.value as "global" | "local")}>
                  <option value="global">グローバル</option>
                  <option value="local">ローカル</option>
                </select>
              </label>
            </form>
            <h3>ズームレベル（Z）</h3>
            <form>
              <label>
                <input
                  type="range"
                  name="internal-zoom"
                  max={6}
                  step={1}
                  value={localSpaceZoom}
                  onChange={(ev) => {
                    const nextZoom = Number(ev.target.value);
                    // nextZoomで計算した時に 現在のf値 + 1 * ボクセルの高さ が全体範囲の高さを超える場合は、ズームレベルを変更しない
                    const _voxelHeight = namespaceParams.scale / Math.pow(2, nextZoom);
                    if ((interestedLocalF + 1) * _voxelHeight > namespaceParams.scaleHeight) {
                      return;
                    } else {
                      setLocalSpaceZoom(nextZoom);
                    }
                  }}
                />
                {localSpaceZoom}
              </label>
            </form>
            <label>
              <span>ローカル空間の表示するF値</span>
              <input
                type="number"
                name="interestedLocalF"
                min={0}
                max={
                  voxelHeight
                    ? Math.floor(namespaceParams.scaleHeight / voxelHeight) - 1
                    : Math.pow(2, localSpaceZoom) - 1
                }
                value={interestedLocalF}
                onChange={ev => setInterestedLocalF(Number(ev.target.value))}
              />
            </label>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>
                <span>ボクセルの高さ: </span>
                <span>{`${voxelHeight}m`}</span>
              </label>
              {/* <label>
                <span>ボクセルの底面の高さ: </span>
                <span>{`${voxelMinAltitude}m`}</span>
              </label>
              <label>
                <span>ボクセル天面の高さ: </span>
                <span>{`${voxelMaxAltitude}m`}</span>
              </label> */}
            </div>
            <hr />
            <h3>グローバルズームレベル（Z）</h3>
            <form>
              <label>
                <input
                  type="range"
                  name="global-zoom"
                  min={18}
                  max={25}
                  step={1}
                  value={globalSpaceZoom}
                  onChange={ev => setGlobalSpaceZoom(Number(ev.target.value))}
                />
                {globalSpaceZoom}
              </label>
            </form>
          </div>
        </GeoloniaMap.Control>
        <GeoloniaMap.Control
          position="top-left"
          containerProps={{ className: "maplibregl-ctrl maplibregl-ctrl-group map-ctrl-click-info" }}
        >
          <div className="map-ctrl-input-form">
            <h3>詳細情報</h3>
            <RenderClickedFeatures features={clickedFeatures} />
          </div>
        </GeoloniaMap.Control>
      </GeoloniaMap>
    </div>
  );
}

export default App;
