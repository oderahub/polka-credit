// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CreditScoreSBT} from "../src/credit/CreditScoreSBT.sol";
import {GovernanceVerifierAdapter} from "../src/credit/GovernanceVerifierAdapter.sol";
import {SystemPrecompileVerifier} from "../src/credit/SystemPrecompileVerifier.sol";
import {SYSTEM_ADDR} from "../src/interfaces/ISystem.sol";
import {LendingDemo} from "../src/lending/LendingDemo.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function envAddress(string calldata name) external view returns (address);
    function envOr(string calldata name, address defaultValue) external view returns (address);
    function envOr(string calldata name, uint256 defaultValue) external view returns (uint256);
    function addr(uint256 privateKey) external view returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
    function writeFile(string calldata path, string calldata data) external;
    function projectRoot() external view returns (string memory);
    function toString(address value) external pure returns (string memory);
    function toString(uint256 value) external pure returns (string memory);
}

address constant VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));

contract DeployPolkaZKCredit {
    Vm internal constant vm = Vm(VM_ADDRESS);

    error InvalidOwner(address owner, address deployer);

    struct DeploymentConfig {
        uint256 privateKey;
        address owner;
        address systemPrecompile;
        address quoteAsset;
        uint256 baseAprBps;
        uint256 baseBorrowAmount;
        uint256 writeDeploymentFile;
    }

    struct DeploymentResult {
        address scoreToken;
        address verifier;
        address adapter;
        address lendingDemo;
        address owner;
        address systemPrecompile;
        address quoteAsset;
    }

    function run() external {
        DeploymentConfig memory config = _loadConfig();
        DeploymentResult memory result;

        vm.startBroadcast(config.privateKey);

        CreditScoreSBT scoreToken = new CreditScoreSBT(config.owner);
        SystemPrecompileVerifier verifier = new SystemPrecompileVerifier(config.systemPrecompile);
        GovernanceVerifierAdapter adapter =
            new GovernanceVerifierAdapter(config.owner, address(verifier), scoreToken);
        scoreToken.setMinter(address(adapter));

        LendingDemo lendingDemo =
            new LendingDemo(scoreToken, config.quoteAsset, config.baseAprBps, config.baseBorrowAmount);

        vm.stopBroadcast();

        result = DeploymentResult({
            scoreToken: address(scoreToken),
            verifier: address(verifier),
            adapter: address(adapter),
            lendingDemo: address(lendingDemo),
            owner: config.owner,
            systemPrecompile: config.systemPrecompile,
            quoteAsset: config.quoteAsset
        });

        if (config.writeDeploymentFile != 0) {
            _writeDeploymentArtifact(result, config);
        }
    }

    function _loadConfig() internal view returns (DeploymentConfig memory config) {
        config.privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(config.privateKey);

        config.owner = vm.envOr("OWNER_ADDRESS", deployer);
        if (config.owner != deployer) revert InvalidOwner(config.owner, deployer);
        config.systemPrecompile = vm.envOr("SYSTEM_PRECOMPILE_ADDRESS", SYSTEM_ADDR);
        config.quoteAsset = vm.envAddress("QUOTE_ASSET_ADDRESS");
        config.baseAprBps = vm.envOr("BASE_APR_BPS", 1200);
        config.baseBorrowAmount = vm.envOr("BASE_BORROW_AMOUNT", 1_000 ether);
        config.writeDeploymentFile = vm.envOr("WRITE_DEPLOYMENT_FILE", 0);
    }

    function _writeDeploymentArtifact(DeploymentResult memory result, DeploymentConfig memory config) internal {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/deployments/latest.json");
        string memory json = string.concat(
            "{\n",
            '  "owner": "',
            vm.toString(result.owner),
            '",\n',
            '  "scoreToken": "',
            vm.toString(result.scoreToken),
            '",\n',
            '  "verifier": "',
            vm.toString(result.verifier),
            '",\n',
            '  "adapter": "',
            vm.toString(result.adapter),
            '",\n',
            '  "lendingDemo": "',
            vm.toString(result.lendingDemo),
            '",\n',
            '  "systemPrecompile": "',
            vm.toString(result.systemPrecompile),
            '",\n',
            '  "quoteAsset": "',
            vm.toString(result.quoteAsset),
            '",\n',
            '  "baseAprBps": "',
            vm.toString(config.baseAprBps),
            '",\n',
            '  "baseBorrowAmount": "',
            vm.toString(config.baseBorrowAmount),
            '"\n',
            "}\n"
        );

        vm.writeFile(path, json);
    }
}
