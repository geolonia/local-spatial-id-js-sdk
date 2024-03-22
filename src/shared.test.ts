import { LocalNamespace } from "./local_namespace";

export const namespaces: { [key: string]: LocalNamespace } = {
  // 東京都庁: 35.68950097945576, 139.69172572944066
  "tokyo": new LocalNamespace({
    scale: 10e3, // 10km
    origin_latitude: 35.68950097945576,
    origin_longitude: 139.69172572944066,
  }),
};

export const geoJsons: { [key: string]: GeoJSON.Feature } = {
  "tokyo/shinjuku-gyoen": {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "coordinates": [
        [
          [
            139.70628491541703,
            35.68921001984897
          ],
          [
            139.70406747777417,
            35.686490077129505
          ],
          [
            139.7045062018879,
            35.68485794404597
          ],
          [
            139.7101187624384,
            35.68149974326194
          ],
          [
            139.71372308796498,
            35.680972774036505
          ],
          [
            139.71478422721543,
            35.68710913502137
          ],
          [
            139.71051138929818,
            35.687746953301655
          ],
          [
            139.70628491541703,
            35.68921001984897
          ]
        ]
      ],
      "type": "Polygon"
    }
  }

};
