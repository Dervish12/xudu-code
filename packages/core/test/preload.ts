process.env.XUDU_DB = ":memory:"
// Fixtures load project configuration freely; workspace trust has its own tests that unset this.
process.env.XUDU_TRUST_ALL = "1"
process.env.XUDU_SKIP_READ_CHECK = "1"
process.env.NPM_CONFIG_AUDIT = "false"
