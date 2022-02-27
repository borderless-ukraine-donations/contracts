//SPDX-License-Identifier: BSD
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DonationForwarderOnThunderCore {
    using SafeERC20 for IERC20;

    // https://docs.developers.thundercore.com/bridges/ethereum-contract-address
    IERC20 public constant TT_USDT = IERC20(0x4f3C8E20942461e2c3Bdd8311AC57B0c222f2b82);
	address public constant USDT_HOME_BRIDGE_ADDR = 0x2C66e58c123fe807ef9c36682257fA6bfB4AFA52;

    IERC20 public constant TT_ETH = IERC20(0x6576Bb918709906DcbFDCeae4bB1e6df7C8a1077);
    address public constant ETH_HOME_BRIDGE_ADDR = 0x09b122f3d3f971e8fb2e311135BE7E10513E0B0D;

    function transferToEthereumBridge() public {
        uint256 x = TT_USDT.balanceOf(address(this));
        if (x > 0) {
            TT_USDT.safeTransfer(USDT_HOME_BRIDGE_ADDR, x);
        }
        x = TT_ETH.balanceOf(address(this));
        if (x > 0) {
            TT_ETH.safeTransfer(ETH_HOME_BRIDGE_ADDR, x);
        }
    }
}
