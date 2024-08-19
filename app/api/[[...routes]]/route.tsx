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

// Uncomment to use Edge Runtime
// export const runtime = 'edge'
app.frame('/', (c) => {
    return c.res({
        action: '/finish',
        image: (
            <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 60 }}>
                Perform a transaction
            </div>
        ),
        intents: [
            <TextInput placeholder="Value (ETH)" />,
            <Button.Transaction target="/send-ether">Send Ether</Button.Transaction>,
            // <Button.Transaction target="/mint">Mint</Button.Transaction>,
        ]
    })
})

app.frame('/finish', (c) => {
    const { transactionId } = c
    return c.res({
        image: (
            <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
                Transaction ID: {transactionId}
            </div>
        )
    })
})

app.transaction('/send-ether', (c) => {
    const { inputText } = c
    // Send transaction response.
    return c.send({
        chainId: 'eip155:10',
        to: '0x91eBbA819E4BbA03065a106290afcB44deB1F9d6',
        value: parseEther(inputText!),
    })
})

app.transaction('/mint', (c) => {
    const { inputText } = c
    // Contract transaction response.
    return c.contract({
        abi,
        chainId: 'eip155:10',
        functionName: 'mint',
        args: [69420n],
        to: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
        value: parseEther(inputText!)
    })
})

devtools(app, { serveStatic })

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
