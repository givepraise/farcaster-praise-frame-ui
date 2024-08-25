/** @jsxImportSource frog/jsx */

import {Button, Frog, parseEther} from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { neynar } from 'frog/hubs'
import {abi} from "@/src/abi";
import { AbiCoder } from "ethers";
import * as url from "node:url";
import frogRoutes from "@/src/frogRoutes";
import {imageDescription, imageWrapper} from "@/src/frogStyles";

const feeRecipient = '0xAB5b57832498a2B541AAA2c448e2E79d872564E0'
const feeInEth = '0.000001' // 0.000018
const attestationSmartContract = '0x4200000000000000000000000000000000000021' // Attestation smart contract in OP
const attestationSchema = '0xa76299ae6a66b66ff48344f36c0fa657a0a9eeb6721248311df9cf25748e4405' // Attestation schema

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  hub: neynar({ apiKey: 'NEYNAR_FROG_FM' }),
  title: 'Praise in Farcaster',
})

// export const runtime = 'edge'
app.frame(frogRoutes.home, (c) => {
    const reqUrl = c.req.url
    const queryData = url.parse(reqUrl, true).query;
    const { recipientName } = queryData
    return c.res({
        action: frogRoutes.attestFrame,
        image: (
            <div style={imageWrapper}>
                {`Let's mint an on-chain attestation for @${recipientName} to keep record!`}
                <div style={imageDescription}>
                    Make sure you have a bit of ETH on OP for gas
                </div>
            </div>
        ),
        intents: [
            <Button.Transaction target={frogRoutes.feesTx}>Pay the fee first!</Button.Transaction>,
        ]
    })
})

app.frame(frogRoutes.finish, (c) => {
    return c.res({
        image: (
            <div style={imageWrapper}>
                Thanks for using Praise and spreading gratitude and thankfulness!
            </div>
        )
    })
})

app.transaction(frogRoutes.feesTx, (c) => {
    return c.send({
        chainId: 'eip155:10',
        to: feeRecipient,
        value: parseEther(feeInEth),
    })
})

app.frame(frogRoutes.attestFrame, (c) => {
    const {frameData} = c
    const queryData = url.parse(frameData?.url || "", true).query;
    const {recipientName} = queryData
    return c.res({
        action: frogRoutes.finish,
        image: (
            <div style={imageWrapper}>
                {`Let's mint an on-chain attestation for @${recipientName} to keep record!`}
                <div style={imageDescription}>
                    Make sure you have a bit of ETH on OP for gas
                </div>
            </div>
        ),
        intents: [
            <Button.Transaction target={frogRoutes.attestTx}>Now let's mint!</Button.Transaction>,
        ]
    })
})

app.transaction(frogRoutes.attestTx, async (c) => {
    const {frameData} = c
    const queryData = url.parse(frameData?.url || '', true).query;
    const { reason, channel, recipientAddress, giver } = queryData
    const abiCoder = new AbiCoder();
    const types = ["bool", "string", "string", "string"];
    const values = [true, giver, channel, reason];
    const encodedData = abiCoder.encode(types, values) as `0x${string}`;
    return c.contract({
        abi,
        chainId: 'eip155:10',
        functionName: 'attest',
        args: [{
            schema: attestationSchema,
            data: {
                revocable: true,
                recipient: recipientAddress as `0x${string}`,
                refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
                expirationTime: 0n,
                data: encodedData,
                value: 0n,
            },
        }],
        to: attestationSmartContract,
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
