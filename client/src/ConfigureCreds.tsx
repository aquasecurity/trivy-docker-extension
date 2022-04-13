
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Typography } from '@mui/material';

export function ConfigureCreds(props: any) {

    const [open, setOpen] = React.useState(false);
    const [key, setKey] = React.useState("");
    const [secret, setSecret] = React.useState("");

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSaveDetails = () => {
        const payload = { aqua_key: key, aqua_secret: secret };
        // window.ddClient.extension.vm.service.request({ url: "/creds", method: "POST", headers: { 'Content-Type': 'application/json' }, data: payload })
        //     .catch((error: any) => {
        //         console.log(error);
        //     });

        window.ddClient.extension.vm.service.post("/credentials",
            { headers: { 'Content-Type': 'application/json' }, data: payload })
            .catch((error: any) => {
                console.log(error);
            })
        setOpen(false);
    };

    const handleAVDLinkClick = (e: any) => {
        { window.ddClient.host.openExternal("https://cloud.aquasec.com/cspm/#/apikeys") };
    }

    return (
        <Box sx={{ float: 'right', marginTop: '0.5rem' }}>
            <Box sx={{ display: 'flex' }}>
                <Typography sx={{ marginTop: '0.5rem' }}>Aqua customer?
                    <Button onClick={handleClickOpen}>
                        Add API Keys
                    </Button>
                </Typography>
            </Box>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Save Aqua Credentials</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your Aqua Security API credentials, these are available in your Aqua CSPM Account
                    </DialogContentText>
                    <TextField
                        margin="dense"
                        id="name"
                        label="Aqua Key"
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        fullWidth
                        variant="standard"
                        helperText="AQUA_KEY provided in you CSPM account"
                    />
                    <TextField
                        margin="dense"
                        id="secret"
                        label="Aqua Secret"
                        type="password"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        fullWidth
                        variant="standard"
                        helperText="AQUA_SECRET provided in you CSPM account"
                    />

                </DialogContent>
                <DialogActions>
                    <Button sx={{ float: 'left' }} onClick={handleAVDLinkClick}>Get API Keys</Button>
                    <Button variant="outlined" onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveDetails}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}