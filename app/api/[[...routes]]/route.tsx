/** @jsxImportSource frog/jsx */

import {Button, Frog} from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { neynar } from 'frog/hubs'
import {abi} from "@/src/abi";
import * as url from "node:url";
import frogRoutes from "@/src/frogRoutes";
import {imageDescription, imageWrapper} from "@/src/frogStyles";
import {NETWORK_IDS} from "@/src/helpers/constants";

const chainId = NETWORK_IDS.BASE_SEPOLIA;
const attestationSmartContract = '0xc7970e9c5aa18a7a9bf21c322bfa8ecebe7b7a26' // Our smart contract in Base
const eipChainId = `eip155:${chainId}` as "eip155:84532" // Base
const sendAttestationUrl = "https://farcasterbot.givepraise.xyz/reply-attestation" // Send attestation URL to user in another cast

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
        action: frogRoutes.finish,
        image: (
            <div style={imageWrapper}>
                {`Let's mint an on-chain attestation for @${recipientName} to keep record!`}
                <div style={imageDescription}>
                    Make sure you have a bit of ETH on Base for gas
                </div>
            </div>
        ),
        intents: [
            <Button.Transaction target={frogRoutes.attestTx}>Mint!</Button.Transaction>,
        ]
    })
})

const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

app.frame(frogRoutes.finish, async (c) => {
    const {frameData, transactionId} = c
    const queryData = url.parse(frameData?.url || '', true).query;
    const { praiseHash } = queryData
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    console.log('-----------------')
    console.log('raw', transactionId, praiseHash)
    console.log('-----------------')

    const raw = JSON.stringify({
        praiseHash,
        txHash: transactionId
    });

    const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch(sendAttestationUrl, requestOptions)
        .then(response => response.text())
        .then(result => {
            console.log('-----------------')
            console.log('result', result)
            console.log('-----------------')
        })
        .catch(error => {
            console.log('-----------------')
            console.error('error', error)
            console.log('-----------------')
        });

    // Wait for fetch to send the request
    await wait(2000);

    return c.res({
        image: (
            <div style={imageWrapper}>
                Thanks for using Praise and spreading gratitude and thankfulness!
            </div>
        )
    })
})

app.transaction(frogRoutes.attestTx, async (c) => {
    const {frameData} = c
    const queryData = url.parse(frameData?.url || '', true).query;
    const { reason, channel, recipientAddress, giver, recipientName } = queryData
    return c.contract({
        abi,
        chainId: eipChainId,
        functionName: 'attestPraise',
        args: [
            recipientAddress as `0x${string}`,
            {
            from: frameData?.address as `0x${string}`,
            amount: 0,
            platform: channel as string,
            url: "www.givepraise.xyz" as string,
            context: recipientName as string,
            skill: reason as string,
            tag: giver as string,
            note: "Created using Praise bot on Farcaster",
            weight: 0
        }],
        to: attestationSmartContract,
        value: 100000000000n,
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
