Some usefull commands:

#### For the erc20.ligo file:

##### Compilation...
```
ligo compile-contract erc20.ligo main | tr -d '\r' > erc20.tz
```

##### Execution of dry-run commands...

Method Approve:
```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'Approve(("tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx": address), 10n)' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> 10n; end; end; end; totalSupply = 10n; end'
```
```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'Approve(("tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx": address), 10n)' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9" : address) -> record balance = 50n; allowances =  map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> 50n; end; end; end; totalSupply = 10n; end'
```

Method Allowance:
```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'Allowance(("tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx": address), ("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address))' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> 10n; end; end; end; totalSupply = 10n; end'
```

Method TotalSupply:
```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'TotalSupply(unit)' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> 10n; end; end; end; totalSupply = 10n; end'
```

Method BalanceOf:
 ```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'BalanceOf(("tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx": address))' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> 10n; end; end; end; totalSupply = 10n; end'
```
```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'BalanceOf(("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4": address))' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> 10n; end; end; end; totalSupply = 10n; end'
```

Method Transfer:
```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'Transfer(("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4": address), ("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address), 10n)' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> 10n; end; end; end; totalSupply = 10n; end'
```

```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'Transfer(("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4": address), ("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address), 10n)' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9" : address) -> 5n; end; end; end; totalSupply = 10n; end'
```
```
ligo dry-run erc20.ligo --format=json --syntax=pascaligo --sender=tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9 main 'Transfer(("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4": address), ("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address), 10n)' 'record owner = "tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9"; accounts = big_map("tz1MZ4GPjAA2gZxKTozJt8Cu5Gvu6WU2ikZ4" : address) -> record balance = 10n; allowances =  map("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9" : address) -> 10n; end; end; end; totalSupply = 10n; end'
```

#### For the full-pool.ligo file:

##### Compilation...
```
ligo compile-contract full-pool.ligo main | tr -d '\r' > full-pool.tz
```

#### For the interest.ligo file:

##### Compilation...
```
ligo compile-contract interest.ligo main | tr -d '\r' > interest.tz
```

##### Execution of dry-run commands...
```
ligo dry-run interest.ligo --format=json --syntax=pascaligo  main unit "record interest = 0tez; end"
```