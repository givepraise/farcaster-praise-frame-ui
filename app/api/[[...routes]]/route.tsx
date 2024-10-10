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
import {AbiCoder} from "ethers";

const chainId = NETWORK_IDS.BASE_MAINNET;
const attestationSmartContract = '0xabdf10bbbccef43942dc8a1da8ae27ddda1d47d8' // Our smart contract in Base
const eipChainId = `eip155:${chainId}` as "eip155:8453" // Base
const sendAttestationUrl = "https://farcasterbot.givepraise.xyz/reply-attestation" // Send attestation URL to user in another cast
const neynarFetchCastUrl = 'https://api.neynar.com/v2/farcaster/cast?type=hash&identifier='

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  hub: neynar({ apiKey: 'NEYNAR_FROG_FM' }),
  title: 'Praise in Farcaster',
})

// export const runtime = 'edge'
app.frame(frogRoutes.home, (c) => {
    // const reqUrl = c.req.url
    // const queryData = url.parse(reqUrl, true).query;
    // const { recipientName } = queryData
    return c.res({
        action: frogRoutes.finish,
        image: 'https://giveth.mypinata.cloud/ipfs/QmXZgUWie1dDcjq75V6jEWigg6Hifwj4o4VM2sSJGxTwv1',
        // image: (
        //     <div style={imageWrapper}>
        //         {`Let’s spread some love and mint an on-chain Praise attestation for @${recipientName}!`}
        //         <div style={imageDescription}>
        //             Make sure you have some ETH on Base to cover the gas.
        //         </div>
        //     </div>
        // ),
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
    // const { reason, channel, recipientAddress, giver, recipientName } = queryData
    const { praiseHash } = queryData
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("api_key", process.env.NEYNAR_API_KEY!);
    const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    const praiseCast = await fetch(neynarFetchCastUrl + praiseHash, requestOptions)
    const praiseCastData = await praiseCast.json()
    const { channel, author, text, mentioned_profiles } = praiseCastData.cast;
    const giver = author.username
    // TODO: Should consider only first mention as praise receiver
    const praiseHandle = process.env.PRAISE_FARCASTER_HANDLE;
    const isPraiseHandleReceiver = text.startsWith(`@${praiseHandle} to @${praiseHandle}`);
    const praiseReceiver = mentioned_profiles.find((profile: any) => isPraiseHandleReceiver ? profile.username === praiseHandle : profile.username !== praiseHandle)
    const recipientName = praiseReceiver.username
    const reason = text.split(praiseReceiver.username)[1]
    console.log('-----------------')
    console.log('praiseCast', channel?.name, author.username, praiseReceiver, text, mentioned_profiles)
    console.log('-----------------')
    const recipientAddress = praiseReceiver.verified_addresses.eth_addresses[0] || praiseReceiver.custody_address
    const abiCoder = new AbiCoder();
    const types = ["address", "uint16", "string", "string", "string", "string", "string", "string", "uint16"];
    const values = [frameData?.address, 0, channel?.name || '', "www.givepraise.xyz", recipientName, reason, giver, "Created using Praise bot on Farcaster", 0];
    const encodedData = abiCoder.encode(types, values) as `0x${string}`;
    return c.contract({
        abi,
        chainId: eipChainId,
        functionName: 'attestPraise',
        args: [
            recipientAddress as `0x${string}`,
            encodedData
            ],
        to: attestationSmartContract,
        value: 30000000000000n,
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
