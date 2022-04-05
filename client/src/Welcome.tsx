import { Card, CardContent, Typography, CardActions, Button } from "@mui/material";
import { Box } from "@mui/system";
import { ImageList } from './ImageList';


export function Welcome(props: any) {
    const goToTrivy = () => {
        window.ddClient.host.openExternal("https://trivy.dev")
    }

    return (
        <Box flexDirection='column' alignItems="center" sx={{ minWidth: 275, m: '8rem', flexDirection: "column", display: props.showWelcome, justifyContent: 'center' }}>
            <Box sx={{ display: 'flex' }}>
                <img src="images/trivy_logo.svg" alt="Trivy Logo" height="160px" />
                <Box sx={{ marginLeft: '0.8rem', marginTop: '1.8rem' }}>
                    <Typography variant="h3" fontFamily='Droplet'>
                        aqua
                    </Typography>
                    <Typography variant="h1" fontFamily='Droplet'>
                        trivy
                    </Typography>
                </Box>
            </Box>
            <Typography variant="h4" component="div" gutterBottom sx={{ marginTop: '2.5rem' }}>
                Free, open-source container image scanning for local and remote images.
            </Typography>
            <Typography variant="h5" sx={{ marginTop: '2rem' }}>
                <img src="images/tada.svg" alt="Tada Logo" height="20px" /> Scan unlimited images, no sign up required! Scans run on your machine.<img src="images/tada.svg" alt="Tada Logo" height="20px" />
            </Typography>
            <Typography variant="h5" sx={{ marginTop: '2rem' }}>
                Select from one of your locally stored images or enter the name of a remote image you wish to scan.

            </Typography>
            <Box marginTop='4rem' width='80%' maxWidth='800px'>
                <ImageList
                    disableScan={props.disableScan}
                    setDisableScan={props.setDisableScan}
                    scanImage={props.scanImage}
                    setScanImage={props.setScanImage}
                    runScan={props.runScan}
                    imageUpdated={props.imageUpdated}
                    fixedOnly={props.fixedOnly}
                    setFixedOnly={props.setFixedOnly}
                    textAlign='center'
                />
            </Box>
            <Box width='40%' maxWidth='400px' marginTop='2.5rem'>
                <Card sx={{ display: 'flex', p: '2rem' }}>
                    <CardContent sx={{ display: 'flex' }}>
                        <Typography variant="h6" marginTop='5px' marginRight='20px' >New to Trivy?   </Typography>
                        <Button onClick={goToTrivy}><Typography variant="h6">Learn more...</Typography></Button>
                    </CardContent>
                </Card>
            </Box>
        </Box >
    )
}