/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {abi} from "@/src/abi";

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
  title: 'Praise in Farcaster',
})

// export const runtime = 'edge'
app.frame('/', (c) => {
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
            <Button.Transaction target="/attest">Attest</Button.Transaction>,
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

app.transaction('/attest', (c) => {
    return c.contract({
        abi,
        chainId: 'eip155:10',
        functionName: 'attest',
        args: [{
            schema: '0xa76299ae6a66b66ff48344f36c0fa657a0a9eeb6721248311df9cf25748e4405',
            data: {
                revocable: true,
                recipient: '0x4236864edA3B7863B4E543c2661FC14029e5fBEC',
                refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
                expirationTime: 0n,
                data: '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000572616d696e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008676976657468696f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010666f72206372656174696e672065746800000000000000000000000000000000',
                value: 0n,
            },
        }],
        to: '0x4200000000000000000000000000000000000021',
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
