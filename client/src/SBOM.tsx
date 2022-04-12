
import { Box, Button, Card, CardContent, Stack } from '@mui/material';


export function SBOM(props: any) {


    const saveToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(props.SBOMContent, null, 2));
    }

    const saveSBOMToFile = () => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(props.SBOMContent, null, 2)], {
            type: "text/plain"
        });
        element.href = URL.createObjectURL(file);
        element.download = "sbom.json";
        document.body.appendChild(element);
        element.click();
    };

    return (
        <Box sx={{ m: '2rem', display: props.showSBOM }}>
            <Stack spacing={1} direction="row" sx={{ float: 'right', marginBottom: '0.5rem', }}>
                <Button variant="contained" onClick={saveToClipboard}>Copy to Clipboard</Button>
                <Button variant="contained" onClick={saveSBOMToFile}>Save SBOM to File</Button>
            </Stack>
            <Card sx={{ p: '1rem', border: '1 solid', clear: 'both', flexWrap: 'wrap' }}>
                <CardContent>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(props.SBOMContent, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </Box >
    )

}

