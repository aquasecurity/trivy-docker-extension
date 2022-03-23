import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { Links } from "./Links";
import { ImageList } from "./ImageList";


export function DefaultDisplay(props: any) {

    return (
        <Box sx={{ display: props.displayStandard, marginTop: '2rem' }}>
            <Box sx={{ m: '2rem' }}>
                <Links />
                <Box sx={{ display: 'flex' }}>
                    <img src="images/trivy_logo.svg" alt="Trivy Logo" height="100px" />
                    <Box sx={{ marginLeft: '0.5rem', marginTop: '0.7rem' }}>
                        <Typography variant="h4" fontFamily='Droplet'>
                            aqua
                        </Typography>
                        <Typography variant="h2" fontFamily='Droplet'>
                            trivy
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ marginLeft: '2rem' }}>
                <ImageList
                    scanImage={props.scanImage}
                    setScanImage={props.setScanImage}
                    runScan={props.runScan}
                    imageUpdated={props.imageUpdated}
                />
            </Box>
        </Box>)
}