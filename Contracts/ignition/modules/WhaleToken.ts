import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WhaleTokenModule = buildModule("WhaleTokenModule", (m) => {
    const whaleToken = m.contract("WhaleToken");
    return { whaleToken };
});

export default WhaleTokenModule;
