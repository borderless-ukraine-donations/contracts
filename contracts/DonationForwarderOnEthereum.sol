//SPDX-License-Identifier: BSD
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DonationForwarderOnEthereum {
    using SafeERC20 for IERC20;

    address payable public constant UKRAINE_CRYPTO_DONATION_ADDR = payable(0x165CD37b4C644C2921454429E7F9358d18A45e14);

    function transferToUkraineDonations(IERC20 token, uint256 amount) public {
        token.safeTransfer(UKRAINE_CRYPTO_DONATION_ADDR, amount);
    }

    function transferEthToUkraineDonations() public {
        UKRAINE_CRYPTO_DONATION_ADDR.transfer(address(this).balance);
    }

    receive() external payable {}
}
