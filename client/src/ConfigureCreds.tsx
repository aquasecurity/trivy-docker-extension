
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { SendMetric } from './Metrics';

export function ConfigureCreds(props: any) {

    let loginDisplay = !props.loggedIn ? "flex" : "none";
    let logoutDisplay = props.loggedIn ? "block" : "none";

    const handleSignInClick = () => {
        props.setOpen(true);
    };

    const handleClose = () => {
        props.setOpen(false);
    };

    const handleSaveDetails = () => {
        let payload = { aqua_key: props.aquaKey, aqua_secret: props.aquaSecret };
        console.log(payload);
        window.ddClient.extension.vm.service.request({ url: "/credentials", method: "POST", headers: { 'Content-Type': 'application/json' }, data: payload })
            .then(() => {
                window.ddClient.desktopUI.toast.success(
                    `Successfully logged in`
                );
                SendMetric("trivy_aqua_login_successful", { aquaKey: props.aquaKey });
                props.setLoggedIn(true);
                props.setOpen(false);
            })
            .catch((error: any) => {
                window.ddClient.desktopUI.toast.error(
                    `Failed to validate login credentials`
                );
                SendMetric("trivy_aqua_login_failed", { aquaKey: props.aquaKey });
                props.setAquaKey("");
                props.setAquaSecret("");
                console.log(error);
            });
    };

    const handleSignOutClick = () => {
        props.setAquaKey("");
        props.setAquaSecret("");
        props.setLoggedIn(false);

        let payload = { aqua_key: "", aqua_secret: "" };
        console.log(payload);
        window.ddClient.extension.vm.service.delete("/credentials")
            .then(() => {
                window.ddClient.desktopUI.toast.success(
                    `Successfully logged out`
                );
                props.setOpen(false);
            })
            .catch((error: any) => {
                window.ddClient.desktopUI.toast.error(
                    `Failed to logout`
                );
                console.log(error);
            });
    };

    const handleAVDLinkClick = (e: any) => {
        { window.ddClient.host.openExternal("https://cloud.aquasec.com/cspm/#/apikeys") };
    }

    return (
        <Box sx={{ float: 'right', marginTop: '0.5rem' }}>
            <Button onClick={handleSignInClick} sx={{ display: loginDisplay, fontSize: '12pt', marginTop: '-2px' }}>
                Sign in to Aqua
            </Button>
            <Button onClick={handleSignOutClick} sx={{ display: logoutDisplay, fontSize: '12pt', marginTop: '-2px' }}>
                Sign out
            </Button>
            <Dialog open={props.open} onClose={handleClose}>
                <DialogTitle>Login</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your Aqua Security API credentials, these are available in your Aqua CSPM Account
                    </DialogContentText>
                    <TextField
                        margin="dense"
                        id="aquaKey"
                        label="Aqua Key"
                        type="password"
                        value={props.aquaKey}
                        onChange={(e) => props.setAquaKey(e.target.value)}
                        fullWidth
                        variant="standard"
                        helperText="AQUA_KEY provided in you CSPM account"
                    />
                    <TextField
                        margin="dense"
                        id="aquaSecret"
                        label="Aqua Secret"
                        type="password"
                        value={props.aquaSecret}
                        onChange={(e) => props.setAquaSecret(e.target.value)}
                        fullWidth
                        variant="standard"
                        helperText="AQUA_SECRET provided in you CSPM account"
                    />

                </DialogContent>
                <DialogActions>
                    <Button sx={{ float: 'left' }} onClick={handleAVDLinkClick}>Get API Keys</Button>
                    <Button variant="outlined" onClick={handleClose}>Close</Button>
                    <Button variant="contained" onClick={handleSaveDetails}>Login</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}