// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CreditScoreSBT} from "../src/credit/CreditScoreSBT.sol";
import {AttestedSnapshotVerifier} from "../src/credit/AttestedSnapshotVerifier.sol";
import {GovernanceVerifierAdapter} from "../src/credit/GovernanceVerifierAdapter.sol";
import {LendingDemo} from "../src/lending/LendingDemo.sol";
import {SystemPrecompileVerifier} from "../src/credit/SystemPrecompileVerifier.sol";
import {ISystem} from "../src/interfaces/ISystem.sol";
import {MockSystemPrecompile} from "./mocks/MockSystemPrecompile.sol";
import {MockERC20Precompile} from "./mocks/MockERC20Precompile.sol";

contract PolkaZKCreditTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function testAttestedSnapshotSubmissionMintsScoreAndImprovesQuote() public {
        CreditScoreSBT scoreToken = new CreditScoreSBT(address(this));
        MockERC20Precompile nativeAsset = new MockERC20Precompile();
        uint256 attesterPrivateKey = 0xB0B;
        address attester = vm.addr(attesterPrivateKey);
        MockSystemPrecompile systemPrecompile = new MockSystemPrecompile();
        AttestedSnapshotVerifier verifier = new AttestedSnapshotVerifier(attester, address(systemPrecompile));
        GovernanceVerifierAdapter adapter =
            new GovernanceVerifierAdapter(address(this), address(verifier), scoreToken);

        scoreToken.setMinter(address(adapter));

        uint256 signerPrivateKey = 0xA11CE;
        address user = vm.addr(signerPrivateKey);
        nativeAsset.mint(user, 2_500 ether);
        LendingDemo lendingDemo = new LendingDemo(scoreToken, address(nativeAsset), 1200, 1_000 ether);

        _assertBaseQuote(lendingDemo.quoteFor(user));
        uint256 score =
            _submitAttestedSnapshotCertificate(adapter, verifier, systemPrecompile, attesterPrivateKey, user, 3);
        require(score == 700, "expected score");
        require(scoreToken.getScore(user) == 700, "score not stored");
        _assertImprovedQuote(lendingDemo.quoteFor(user));
    }

    function testSoulboundTransfersRevert() public {
        CreditScoreSBT scoreToken = new CreditScoreSBT(address(this));
        bool reverted;

        try scoreToken.transferFrom(address(this), address(0xBEEF), scoreToken.tokenIdFor(address(this))) {
            reverted = false;
        } catch {
            reverted = true;
        }

        require(reverted, "expected soulbound revert");
    }

    function testInvalidSystemSignatureReverts() public {
        CreditScoreSBT scoreToken = new CreditScoreSBT(address(this));
        MockSystemPrecompile systemPrecompile = new MockSystemPrecompile();
        SystemPrecompileVerifier verifier = new SystemPrecompileVerifier(address(systemPrecompile));
        GovernanceVerifierAdapter adapter =
            new GovernanceVerifierAdapter(address(this), address(verifier), scoreToken);

        scoreToken.setMinter(address(adapter));
        systemPrecompile.setShouldVerify(false);

        address user = address(this);
        uint8[64] memory signature;
        signature[0] = 1;
        bytes32 accountHash = systemPrecompile.hashBlake256(systemPrecompile.toAccountId(user));

        GovernanceVerifierAdapter.ProofSubmission memory submission = GovernanceVerifierAdapter.ProofSubmission({
            claimant: user,
            proof: abi.encode(signature, bytes32(uint256(999))),
            publicInputs: abi.encode(uint8(2), accountHash),
            context: abi.encodePacked("bad-signature")
        });

        bool reverted;
        try adapter.submitProof(submission) {
            reverted = false;
        } catch {
            reverted = true;
        }

        require(reverted, "expected invalid signature revert");
    }

    function testInvalidAttestedSnapshotSignatureReverts() public {
        CreditScoreSBT scoreToken = new CreditScoreSBT(address(this));
        uint256 attesterPrivateKey = 0xB0B;
        address attester = vm.addr(attesterPrivateKey);
        MockSystemPrecompile systemPrecompile = new MockSystemPrecompile();
        AttestedSnapshotVerifier verifier = new AttestedSnapshotVerifier(attester, address(systemPrecompile));
        GovernanceVerifierAdapter adapter =
            new GovernanceVerifierAdapter(address(this), address(verifier), scoreToken);

        scoreToken.setMinter(address(adapter));

        uint256 signerPrivateKey = 0xA11CE;
        address user = vm.addr(signerPrivateKey);
        bytes32 datasetId = keccak256(abi.encodePacked("polkazk-demo-governance-snapshot:tier-2"));
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes32 certificateHash = verifier.buildCertificateHash(user, 2, deadline, datasetId);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xBEEF, _toEthSignedMessageHash(certificateHash));

        GovernanceVerifierAdapter.ProofSubmission memory submission = GovernanceVerifierAdapter.ProofSubmission({
            claimant: user,
            proof: abi.encodePacked(r, s, v),
            publicInputs: abi.encode(uint8(2), deadline),
            context: abi.encode(datasetId)
        });

        bool reverted;
        vm.startPrank(user);
        try adapter.submitProof(submission) {
            reverted = false;
        } catch {
            reverted = true;
        }
        vm.stopPrank();

        require(reverted, "expected invalid attested snapshot signature revert");
    }

    function _submitAttestedSnapshotCertificate(
        GovernanceVerifierAdapter adapter,
        AttestedSnapshotVerifier verifier,
        ISystem systemPrecompile,
        uint256 attesterPrivateKey,
        address user,
        uint8 tier
    ) internal returns (uint256 score) {
        bytes32 datasetId = keccak256(abi.encodePacked("polkazk-demo-governance-snapshot:tier-", tier));
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes memory nativeAccountId = systemPrecompile.toAccountId(user);
        require(nativeAccountId.length > 0, "expected native account binding");
        bytes32 certificateHash = verifier.buildCertificateHash(user, tier, deadline, datasetId);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attesterPrivateKey, _toEthSignedMessageHash(certificateHash));

        GovernanceVerifierAdapter.ProofSubmission memory submission = GovernanceVerifierAdapter.ProofSubmission({
            claimant: user,
            proof: abi.encodePacked(r, s, v),
            publicInputs: abi.encode(tier, deadline),
            context: abi.encode(datasetId)
        });

        vm.startPrank(user);
        score = adapter.submitProof(submission);
        vm.stopPrank();
    }

    function _assertBaseQuote(LendingDemo.Quote memory quote) internal pure {
        require(quote.score == 0, "expected zero score");
        require(quote.aprBps == 1200, "expected base apr");
        require(quote.maxBorrowAmount == 1_000 ether, "expected base borrow");
        require(quote.nativeAssetBalance == 2_500 ether, "expected native asset balance");
        require(quote.nativeAssetTotalSupply == 2_500 ether, "expected native asset supply");
    }

    function _assertImprovedQuote(LendingDemo.Quote memory quote) internal pure {
        require(quote.score == 700, "expected updated score");
        require(quote.aprBps == 800, "expected discounted apr");
        require(quote.maxBorrowAmount == 1_500 ether, "expected boosted borrow cap");
        require(quote.nativeAssetBalance == 2_500 ether, "expected native asset balance retained");
    }

    function _toEthSignedMessageHash(bytes32 messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }
}

interface Vm {
    function addr(uint256 privateKey) external view returns (address);
    function sign(uint256 privateKey, bytes32 digest) external view returns (uint8 v, bytes32 r, bytes32 s);
    function startPrank(address msgSender) external;
    function stopPrank() external;
}
