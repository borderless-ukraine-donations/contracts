#!/usr/bin/env ts-node
/* eslint-disable node/no-unpublished-import */
/* eslint-disable no-process-exit */

import { ethers, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { DonationForwarderOnEthereum, DonationForwarderOnThunderCore } from '../typechain'
import path from 'path'
import { ArgumentParser } from 'argparse'
import fs from 'fs'
import type { JsonRpcProvider, StaticJsonRpcProvider } from '@ethersproject/providers'
import process from 'process'
import * as dotenv from 'dotenv'

type mainFunctionType = (args: string[]) => Promise<void>
const mainFunctionMap = new Map<string, mainFunctionType>()

const camelCaseToDash = (n: string): string => {
  // 'coinFlipAttack' -> 'coin-flip-attack'
  const out: string[] = []
  for (const c of n) {
    if (c === c.toUpperCase()) {
      out.push('-', c.toLowerCase())
    } else {
      out.push(c)
    }
  }
  return out.join('')
}

const mainFunction = (f: mainFunctionType) => {
  mainFunctionMap.set(camelCaseToDash(f.name), f)
}

const getContractAt = async (
  contractName: string,
  contractAddr: string,
  signerOrProvider?: Signer | JsonRpcProvider,
) => {
  let fileName
  if (contractName === 'DonationForwarderOnEthereum') {
    fileName = 'DonationForwarderOnEthereum.json'
  } else if (contractName === 'DonationForwarderOnThunderCore') {
    fileName = 'DonationForwarderOnThunderCore.json'
  } else {
    throw new Error(`getContractAt: unknown contract: "${contractName}"`)
  }
  const t = fs.readFileSync(`./artifacts/contracts/${contractName}.sol/${fileName}`, { encoding: 'utf8' })
  const artifact = JSON.parse(t)
  const contract = new ethers.Contract(contractAddr, artifact.abi)
  if (signerOrProvider) {
    return contract.connect(signerOrProvider)
  } else {
    return contract
  }
}

interface ConfigInfo {
  contractAddr: string
  rpc: string
}

const sanityCheck = async (configInfo: ConfigInfo, provider: StaticJsonRpcProvider) => {
  const r: Array<string> = await Promise.all([
    provider.send('eth_chainId', []),
    provider.getCode(configInfo.contractAddr),
  ])
  const [chainIdStr, code0] = r
  const chainIdFromChain = parseInt(chainIdStr)
  if (code0 === '0x') {
    throw new Error(
      `no code is deployed at DEX contract address ${configInfo.contractAddr} on chainId ${chainIdFromChain}`,
    )
  }
}

const txConfirm = async (txPromise: Promise<TransactionResponse>) => {
  const tx = await txPromise
  console.log(`tx submitted, txHash: ${tx.hash}`)
  const receipt = await tx.wait()
  console.log(
    `tx mined in blockNumber: ${receipt.blockNumber}, status: ${receipt.status}, gasUsed: ${receipt.gasUsed}, txHash: ${tx.hash}`,
  )
}

const transferToEthereumBridge = async () => {
  dotenv.config()
  const parser = new ArgumentParser()
  parser.add_argument('rpc-url', { type: 'str', help: 'RPC URL' })
  parser.add_argument('contract-addr', { type: 'str', help: 'Contract Address' })
  const args = parser.parse_args()
  const configInfo = {
    contractAddr: args['contract-addr'],
    rpc: args['rpc-url'],
  }
  const provider = new ethers.providers.StaticJsonRpcProvider(configInfo.rpc)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider)
  console.log('args:', args)

  const c = (await getContractAt(
    'DonationForwarderOnThunderCore',
    configInfo.contractAddr,
    signer,
  )) as DonationForwarderOnThunderCore
  console.log('contract.addr:', c.address)
  await sanityCheck(configInfo, provider)
  await txConfirm(c.transferToEthereumBridge())
}
mainFunction(transferToEthereumBridge)

const transferToUkraineDonations = async () => {
  dotenv.config()
  const parser = new ArgumentParser()
  parser.add_argument('rpc-url', { type: 'str', help: 'RPC URL' })
  parser.add_argument('contract-addr', { type: 'str', help: 'Contract Address' })
  parser.add_argument('token-addr', { type: 'str', help: 'Token Address' })
  parser.add_argument('amount', { type: 'str', help: 'Amount' })
  const args = parser.parse_args()
  const configInfo = {
    contractAddr: args['contract-addr'],
    rpc: args['rpc-url'],
    tokenAddr: args['token-addr'],
    amount: args.amount,
  }
  const provider = new ethers.providers.StaticJsonRpcProvider(configInfo.rpc)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider)
  console.log('args:', args)

  const c = (await getContractAt(
    'DonationForwarderOnEthereum',
    configInfo.contractAddr,
    signer,
  )) as DonationForwarderOnEthereum
  console.log('contract.addr:', c.address)
  await sanityCheck(configInfo, provider)
  await txConfirm(c.transferToUkraineDonations(configInfo.tokenAddr, configInfo.amount))
}
mainFunction(transferToUkraineDonations)

const transferEthToUkraineDonations = async () => {
  dotenv.config()
  const parser = new ArgumentParser()
  parser.add_argument('rpc-url', { type: 'str', help: 'RPC URL' })
  parser.add_argument('contract-addr', { type: 'str', help: 'Contract Address' })
  const args = parser.parse_args()
  const configInfo = {
    contractAddr: args['contract-addr'],
    rpc: args['rpc-url'],
  }
  const provider = new ethers.providers.StaticJsonRpcProvider(configInfo.rpc)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider)
  console.log('args:', args)

  const c = (await getContractAt(
    'DonationForwarderOnEthereum',
    configInfo.contractAddr,
    signer,
  )) as DonationForwarderOnEthereum
  console.log('contract.addr:', c.address)
  await sanityCheck(configInfo, provider)
  await txConfirm(c.transferEthToUkraineDonations())
}
mainFunction(transferEthToUkraineDonations)

const programName = (): string => {
  return path.basename(process.argv[1])
}

const main = () => {
  const f = mainFunctionMap.get(programName())
  if (f === undefined) {
    throw new Error(`command name "${programName()}" is not supported`)
  }
  return f(process.argv.slice(2))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
