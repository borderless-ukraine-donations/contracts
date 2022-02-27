// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat'
import { Contract } from '@ethersproject/contracts'
import fs from 'fs'
import YAML from 'yaml'

interface IChainIdToContract {
  [key: number]: string
}
const chainIdToContractName: IChainIdToContract = {
  1: 'DonationForwarderOnEthereum',
  108: 'DonationForwarderOnThunderCore',
}

const contractDeployConfirm = async (contractPromise: Promise<Contract>) => {
  const contract = await contractPromise
  const tx = contract.deployTransaction
  console.log(`tx submitted, txHash: ${tx.hash}`)
  const receipt = await tx.wait()
  console.log(
    `tx mined in blockNumber: ${receipt.blockNumber}, status: ${receipt.status}, gasUsed: ${receipt.gasUsed}, txHash: ${tx.hash}`,
  )
  return contract
}

const writeDeploymentRecord = async (chainId: number, c: Contract) => {
  const filePath = `chain${chainId}.yaml`
  const txn = await c.deployTransaction
  let receipt: any
  if (txn) {
    receipt = await txn.wait()
  } else {
    receipt = {
      address: c.address,
      blockNumber: 0,
      blockHash: '',
    }
  }
  const data: {
    contract: {
      'deployed-blk': number
      'deployed-blk-hash': string
      chainId: number
      address: string
    }
  } = {
    contract: {
      'deployed-blk': receipt.blockNumber,
      'deployed-blk-hash': receipt.blockHash,
      chainId: chainId,
      address: receipt.contractAddress,
    },
  }
  await fs.promises.writeFile(filePath, YAML.stringify(data))
}

async function main() {
  const [signer] = await ethers.getSigners()
  const chainId = await signer.getChainId()
  const contractName = chainIdToContractName[chainId]

  if (contractName === undefined) {
    console.error(`unsupported chain id: ${chainId}`)
    return
  }
  const contractFactory = await ethers.getContractFactory(contractName)
  const contract = await contractDeployConfirm(contractFactory.deploy())
  await writeDeploymentRecord(chainId, contract)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
