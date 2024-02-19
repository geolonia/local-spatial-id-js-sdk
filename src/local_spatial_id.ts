import type { LocalNamespace } from "./local_namespace";

import { LngLatWithAltitude } from "./lib/types";
import { ZFXYTile } from "./lib/zfxy";

export type LocalSpatialIdInput = LngLatWithAltitude | ZFXYTile | string;

export class LocalSpatialId {
  namespace: LocalNamespace

  constructor(namespace: LocalNamespace, input: LocalSpatialIdInput, zoom?: number) {
  }
}
