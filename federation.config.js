const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'fledge',
  exposes: {
    // Host does not expose anything currently
  },
  remotes: {
    // Declare logical remote names here if statically known
  },
  shared: shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
});


