const { exec } = require("child_process");
const fs = require("fs");

exec(`ligo compile-contract --michelson-format=json $PWD/contracts/erc20.ligo main | tr -d '\r' `, (err, stdout, stderr) => {
    if (err) {
        throw err;
    }
    fs.writeFileSync('./build/erc20_factory.json', stdout);
});