// Fixed pour fixtures isolate vessel regression tests from editorial scheduling.
// Corona and Festbier retain the seeds used when these physical checks were
// recorded, even though their official calendar positions can now change.
import {themeById} from '../../site/js/core.js';

const seeds = {
  pub: {num:1, key:'2026-10-09', markY:0.6336473895981908, markH:0.10183376568136737, K:0.16028254496864974, wobble:0, choppy:false},
  beach: {num:2, key:'2026-10-10', markY:0.5912583994492888, markH:0.07670936007518321, K:0.1561537075182423, wobble:0, choppy:false},
  munich: {num:3, key:'2026-10-11', markY:0.5049501990433782, markH:0.16297386521473528, K:0.1159373656474054, wobble:0, choppy:false}
};

export function physicalGlassParams(id){
  if (!seeds[id]) throw new RangeError('Unknown physical glass fixture: ' + id);
  return {...seeds[id], theme:themeById(id)};
}
