const { exec } = require("child_process");
const fs = require("fs");

const args = process.argv.slice(2);

let contracts = ['fa12', 'pool'];

if( args.length ) {
    contracts = args
}

for (const contract of contracts) {
    exec(`ligo compile-contract --michelson-format=json $PWD/contracts/${contract}.ligo main | tr -d '\r' `, (err, stdout, stderr) => {
        if (err) {
            throw err;
        }
        fs.writeFileSync(`./build/${contract}_factory.json`, stdout);
        console.log(`File ${contract} compiled!`);
    });
}