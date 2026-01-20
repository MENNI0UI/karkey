module.exports = {
    apps: [
        {
            name: "karkey-app",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3000",
            exec_mode: "fork",
            instances: 1,
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
