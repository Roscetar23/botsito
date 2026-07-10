//@ts-check

const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/docs/technologies/react/next/Guides/next-config-setup
  nx: {},
};

const plugins = [
  // Adds the webpack `resolve.extensionAlias` needed to consume workspace
  // libs (e.g. `@asistente/avatar-ui`) that import their own relative
  // modules with an explicit `.js` extension pointing at `.tsx`/`.ts` source
  // (NodeNext style). Turbopack does not support this remapping yet, so the
  // build target is pinned to webpack (see package.json `nx.targets.build`).
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
