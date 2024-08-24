/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {abi} from "@/src/abi";
import { AbiCoder } from "ethers";
import * as url from "node:url";

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: 'Praise in Farcaster',
})

// export const runtime = 'edge'
app.frame('/', (c) => {
    const reqUrl = c.req.url
    const params = reqUrl.split('?')[1]
    return c.res({
        action: '/finish',
        image: (
            <div
                style={{
                    alignItems: 'center',
                    background: 'linear-gradient(to right, #432889, #17101F)',
                    backgroundSize: '100% 100%',
                    display: 'flex',
                    flexDirection: 'column',
                    flexWrap: 'nowrap',
                    height: '100%',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        color: 'white',
                        fontSize: 60,
                        fontStyle: 'normal',
                        letterSpacing: '-0.025em',
                        lineHeight: 1.4,
                        marginTop: 30,
                        padding: '0 120px',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    Perform an attestation!
                </div>
            </div>
        ),
        intents: [
            <Button.Transaction target={"/attest?"+params}>Attest</Button.Transaction>,
        ]
    })
})

app.frame('/finish', (c) => {
    const {transactionId} = c
    return c.res({
        image: (
            <div style={{color: 'white', display: 'flex', fontSize: 60}}>
                Transaction ID: {transactionId}
            </div>
        )
    })
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

app.transaction('/attest', async (c) => {
    const reqUrl = c.req.url
    const queryData = url.parse(reqUrl, true).query;
    const { reason, channel, recipient, giver } = queryData
    const abiCoder = new AbiCoder();
    const types = ["bool", "string", "string", "string"];
    const values = [true, giver, channel, reason];
    const encodedData = abiCoder.encode(types, values) as `0x${string}`;
    await wait(1000)
    return c.contract({
        abi,
        chainId: 'eip155:10',
        functionName: 'attest',
        args: [{
            schema: '0xa76299ae6a66b66ff48344f36c0fa657a0a9eeb6721248311df9cf25748e4405', // Attestation schema
            data: {
                revocable: true,
                recipient: recipient as `0x${string}`,
                refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
                expirationTime: 0n,
                data: encodedData,
                value: 0n,
            },
        }],
        to: '0x4200000000000000000000000000000000000021', // Attestation smart contract in OP
    })
})

devtools(app, {serveStatic})

export const GET = handle(app)
export const POST = handle(app)

// NOTE: That if you are using the devtools and enable Edge Runtime, you will need to copy the devtools
// static assets to the public folder. You can do this by adding a script to your package.json:
// ```json
// {
//   scripts: {
//     "copy-static": "cp -r ./node_modules/frog/_lib/ui/.frog ./public/.frog"
//   }
// }
// ```
// Next, you'll want to set up the devtools to use the correct assets path:
// ```ts
// devtools(app, { assetsPath: '/.frog' })
// ```
