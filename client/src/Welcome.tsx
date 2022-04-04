import { Card, CardContent, Typography, CardActions, Button } from "@mui/material";
import { Box } from "@mui/system";
import { ImageList } from './ImageList';


export function Welcome(props: any) {
    const goToTrivy = () => {
        window.ddClient.host.openExternal("https://trivy.dev")
    }

    return (
        <Box sx={{ minWidth: 275, m: '4rem', display: props.showWelcome, textAlign: 'center' }}>
            <Card raised variant="outlined">
                <CardContent>
                    <Box sx={{ display: 'flex' }}>
                        <img src="images/trivy_logo.svg" alt="Trivy Logo" height="200px" />
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
                        <img src="images/tada.svg" alt="Tada Logo" height="20px" /> Scan unlimited images, no sign up required! Scans run locally, nothing leaves your machine.<img src="images/tada.svg" alt="Tada Logo" height="20px" />
                    </Typography>
                    <Typography variant="h5" sx={{ marginTop: '2rem' }}>
                        Select from one of your locally installed images or simply type the name of the remote image you wish to scan.

                    </Typography>
                    <Box sx={{ marginTop: '3rem' }}>
                        <ImageList
                            scanImage={props.scanImage}
                            setScanImage={props.setScanImage}
                            runScan={props.runScan}
                            imageUpdated={props.imageUpdated}
                            fixedOnly={props.fixedOnly}
                            setFixedOnly={props.setFixedOnly}
                        />
                    </Box>
                </CardContent>
                <CardActions>
                    <Button size="small" onClick={goToTrivy}>Learn More</Button>
                </CardActions>

            </Card>
        </Box>
    )
}