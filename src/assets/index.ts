import {application} from '@ijstech/components';
let moduleDir = application.currentModuleDir;

function fullPath(path: string): string{
    if (path.indexOf('://') > 0)
        return path
    return `${moduleDir}/${path}`
}
export default {
    icons: {
        logo: `${moduleDir}/img/openswap-logo-beta.svg`,
        logoMobile: `${moduleDir}/img/OpenSwap-Logo-Mobile.svg`
    },
    fullPath
}