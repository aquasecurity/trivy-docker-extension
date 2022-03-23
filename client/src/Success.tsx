import { Card, CardContent, Typography } from "@mui/material";
import { Box } from "@mui/system";



export function Success(props: any) {
    return (
        <Box sx={{ minWidth: 275, m: '4rem', p: '2rem', textAlign: 'center', display: props.showSuccess }}>
            <Card>
                <CardContent>

                    <Typography variant="h3" component="div" gutterBottom sx={{ marginTop: '4rem' }}>
                        Great News!
                    </Typography>
                    <img src="images/tada.svg" alt="Tada Logo" height="200px" />


                    <Typography variant="h4" sx={{ marginTop: '2rem' }}>
                        No vulnerabilities were found in {props.scanImage}
                    </Typography>
                </CardContent>

            </Card>
        </Box>
    )
}