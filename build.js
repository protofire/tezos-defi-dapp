const { exec } = require("child_process");
const fs = require("fs");

exec(`ligo compile-contract --michelson-format=json $PWD/contracts/fa12.ligo main | tr -d '\r' `, (err, stdout, stderr) => {
    if (err) {
        throw err;
    }
    fs.writeFileSync('./build/fa12_factory.json', stdout);
});

exec(`ligo compile-contract --michelson-format=json $PWD/contracts/pool.ligo main | tr -d '\r' `, (err, stdout, stderr) => {
    if (err) {
        throw err;
    }
    fs.writeFileSync('./build/pool_factory.json', stdout);
});