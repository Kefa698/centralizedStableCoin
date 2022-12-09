const { developmentChains } = require("../helper-hardhat-config")
const { network, ethers, deployments } = require("hardhat")
const { expect, assert } = require("chai")

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
              it("blocks blacklisted address from transfering and approving ether", async function () {
                  const transferAmount = ethers.utils.parseUnits("1", "ether")
                  const blackListedAccount = accounts[1]
                  const blacklistTx = await centralizedStableCoin.blacklist(
                      blackListedAccount.address
                  )
                  await blacklistTx.wait(1)
                  await expect(
                      centralizedStableCoin.approve(blackListedAccount.address, transferAmount)
                  ).to.be.revertedWith("blacklisted")
                  await expect(
                      centralizedStableCoin.transfer(blackListedAccount.address, transferAmount)
                  ).to.be.revertedWith("blacklisted")
                  await expect(
                      centralizedStableCoin.transferFrom(
                          deployer.address,
                          blackListedAccount.address,
                          transferAmount
                      )
                  ).to.be.revertedWith("blacklisted")
              })
          })
          describe("configure minter", function () {
              it("configures minter and emits an event", async function () {
                  const startingBalance = await centralizedStableCoin.balanceOf(deployer.address)
                  const mintAmount = ethers.utils.parseUnits("100", "ether")
                  expect(
                      await centralizedStableCoin.configureMinter(deployer.address, mintAmount)
                  ).to.emit("MinterConfigured")
              })
              it("removes minter and emits an event", async function () {
                  const mintAmount = ethers.utils.parseUnits("100", "ether")

                  const minterTx = await centralizedStableCoin.configureMinter(
                      deployer.address,
                      mintAmount
                  )
                  await minterTx.wait(1)
                  expect(await centralizedStableCoin.removeMinter(deployer.address)).to.emit(
                      "MinterRemoved"
                  )
              })
              it("allows minters to mint", async function () {
                  const startingBalance = await centralizedStableCoin.balanceOf(deployer.address)
                  const mintAmount = ethers.utils.parseUnits("100", "ether")
                  const configureminterTx = await centralizedStableCoin.configureMinter(
                      deployer.address,
                      mintAmount
                  )
                  await configureminterTx.wait(1)
                  const minterTx = await centralizedStableCoin.mint(deployer.address, mintAmount)
                  await minterTx.wait(1)
                  const endingBalance = await centralizedStableCoin.balanceOf(deployer.address)
                  assert(endingBalance.sub(startingBalance).toString() == mintAmount.toString())
              })
              it("blocks non-minters to mint", async function () {
                  const mintAmount = ethers.utils.parseUnits("100", "ether")
                  await centralizedStableCoin.connect(badActor.address)
                  await expect(
                      centralizedStableCoin.mint(badActor.address, mintAmount)
                  ).to.be.revertedWith("not minter")
              })
          })
          describe("burn", function () {
              it("can burn", async function () {
                  const startingBalance = await centralizedStableCoin.balanceOf(deployer.address)

                  const burnAmount = ethers.utils.parseUnits("10", "ether")
                  const configureBurnTx = await centralizedStableCoin.configureMinter(
                      deployer.address,
                      burnAmount
                  )
                  await configureBurnTx.wait(1)
                  const blackListedAccount = accounts[0]

                  const burnTx = await centralizedStableCoin.burn(burnAmount)
                  await burnTx.wait(1)

                  const endingBalance = await centralizedStableCoin.balanceOf(deployer.address)
                  assert(startingBalance.sub(burnAmount).toString() == endingBalance.toString())
              })
              it("can reverts if account is blacklisted after mint", async function () {
                  const startingBalance = await centralizedStableCoin.balanceOf(deployer.address)

                  const burnAmount = ethers.utils.parseUnits("10", "ether")
                  const configureBurnTx = await centralizedStableCoin.configureMinter(
                      deployer.address,
                      burnAmount
                  )
                  await configureBurnTx.wait(1)
                  const blackListedAccount = accounts[0]

                  //   const burnTx = await centralizedStableCoin.burn(burnAmount)
                  //   await burnTx.wait(1)
                  await centralizedStableCoin.blacklist(blackListedAccount.address)
                  await expect(centralizedStableCoin.burn(burnAmount)).to.be.revertedWith(
                      "blacklisted"
                  )

                  //   const endingBalance = await centralizedStableCoin.balanceOf(deployer.address)
                  //   assert(startingBalance.sub(burnAmount).toString() == endingBalance.toString())
              })
          })
      })
