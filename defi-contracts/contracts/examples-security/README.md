### Role dry-run commands

ligo dry-run role.ligo --format=json --syntax=pascaligo  main 'AddAddress(("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address))' 'record [users = (big_map [] : big_map(address, role));]'

ligo dry-run role.ligo --format=json --syntax=pascaligo  main 'MakeAdmin(("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address))' 'record [users = big_map [("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address) -> User];]'

ligo dry-run role.ligo --format=json --syntax=pascaligo  main 'MakeUser(("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address))' 'record [users = big_map [("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address) -> Admin];]'

### Owner dry-run commands

ligo dry-run owner.ligo --format=json --syntax=pascaligo  main 'AddOwner(("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address))' 'record [owners = (set [] : set(address));]'

ligo dry-run owner.ligo --format=json --syntax=pascaligo  main 'AddOwner(("tz1MbY6h2rAVGECbMj987EyrhBrqt6eoX9Q9": address))' 'record [owners = set [("tz1h87vXP6GgNXnSyJFZsFvWCaTJdicAd5d8": address)];]'