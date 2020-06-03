function natToTz(const val: nat): tez is val * 1tz;

function natToMutez(const val: nat): tez is val * 1mutez;

function tezToMutezAsNat(const val: tez): nat is val / 1mutez;

function tezToNat(const val: tez): nat is val / 1tz;

function natToInt(const val: nat): int is val + 0;

function tezToIntWithTz(const val: tez): int is (val / 1tz) + 0;