const { developmentChains } = require("../helper-hardhat-config")
const { network, ethers, deployments } = require("hardhat")
const { expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("centralizedStableCoin unit test", function () {
          let deployer, badActor, centralizedStableCoin, accounts
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              badActor = accounts[1]
              await deployments.fixture(["centralizedstablecoin"])
              centralizedStableCoin = await ethers.getContract("CentralizedStableCoin")
          })
          describe("blacklist", function () {
              it("Can blacklist and emits an event", async function () {
                  const blackListedAccount = accounts[1]
                  expect(await centralizedStableCoin.blacklist(blackListedAccount.address)).to.emit(
                      "Blacklisted"
                  )
              })
              it("can unbacklist and emits an event", async function () {
                  const blackListedAccount = accounts[1]
                  await centralizedStableCoin.blacklist(blackListedAccount.address)
                  ///unblacklist
                  expect(
                      await centralizedStableCoin.unBlacklist(blackListedAccount.address)
                  ).to.emit("UnBlackListed")
              })
              it("blocks blacklisted address from transfering ether", async function () {
                const transferAmount = ethers.utils.parseUnits("1", "ether")
                const blackListedAccount = accounts[1]
                const blacklistTx = await centralizedStableCoin.blacklist(blackListedAccount.address)
                await blacklistTx.wait(1)
                await expect(
                    centralizedStableCoin.transfer(blackListedAccount.address, transferAmount)
                ).to.be.revertedWith("blacklisted")
              })
          })
      })
