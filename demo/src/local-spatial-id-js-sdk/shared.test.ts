import { LocalNamespace } from "./local_namespace";

export const namespaces: { [key: string]: LocalNamespace } = {
  // 東京都庁: 35.68950097945576, 139.69172572944066
  "tokyo": new LocalNamespace({
    scale: 10e3, // 10km
    origin_latitude: 35.72599, // 35.68950097945576,
    origin_longitude: 139.64657, // 139.69172572944066,
  }),
  "tokyo_45deg": new LocalNamespace({
    scale: 10e3, // 10km
    origin_latitude: 35.74057, // 35.68950097945576,
    origin_longitude: 139.69188, // 139.69172572944066,
    origin_angle: 45,
  }),
  "tokyo_tocho_300m": new LocalNamespace({
    scale: 150,
    origin_altitude: 300, // 都庁の標高から300m高いスペースから、150m正方形のスペースを作成
    origin_latitude: 35.690128926025096,
    origin_longitude: 139.69097558834432,
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
