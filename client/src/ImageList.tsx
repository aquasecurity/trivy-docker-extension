import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Box } from '@mui/system';
import React from 'react';

export function ImageList(props: any) {
    const [open, setOpen] = React.useState(false);
    const [disableScan, setDisableScan] = React.useState(true);
    const [images, setImages] = React.useState<string[]>([]);
    const loading = open && images !== undefined && images.length === 0;
    const ignoredImages = ["aquasec/trivy", "trivy-docker-extension"];

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            setImages([]);
            return;
        }

        (async () => {
            if (active) {
                loadImages();
            }
        })();

        return () => {
            active = false;
        };
    }, [loading]);

    React.useEffect(() => {
        if (!open) {
            loadImages();
        }
    }, [open]);

    const loadImages = () => {
        let images = [];
        try {
            images = window.ddClient.docker.listImages();
        } catch (imageResp) {
            return images;
        }
        Promise.resolve(images).then(images => {
            console.log(images);
            if (images === null || images === undefined || images.length === 0) {
                setImages(["No images found"]);
                return
            }
            const listImages = images.map((images: any) => images.RepoTags)
                .sort()
                .filter((images: any) => images && "<none>:<none>" !== images[0])
                .filter((images: any) => {
                    for (let i = 0; i < ignoredImages.length; i++) {
                        if (images[0].startsWith(ignoredImages[i])) {
                            return false;
                        }
                    }
                    return true;
                })
                .flat();
            setImages(listImages);
        })
    }

    const runScan = () => {
        // disable the scan button as a priority
        setDisableScan(true);
        // run the scan 
        props.runScan();
    }

    const toggleFixedOnly = () => {
        props.setFixedOnly(!props.fixedOnly);
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case "Tab": {
                handleChange(event, props.scanImage);
                break;
            }
            default:
        }
    };

    const handleChange = (e: React.ChangeEvent<{}>, obj: string) => {
        setDisableScan(true);
        props.imageUpdated();
        if (obj && obj !== "No images found") {
            props.setScanImage(obj);
            setDisableScan(false);
        }
    }

    return (
        <Box>
            <Box sx={{ display: 'flex' }}>
                <Autocomplete
                    value={props.scanImage}
                    freeSolo
                    id="scanSelector"
                    options={images}
                    open={open}
                    onOpen={() => {
                        setOpen(true);
                    }}
                    onClose={() => {
                        setOpen(false);
                    }}
                    sx={{ width: 500 }}
                    loading={loading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="Scan Image"
                        />)}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                <Button sx={{ marginLeft: '3px' }}
                    variant="contained"
                    disabled={disableScan}
                    onClick={runScan}>
                    Scan
                </Button>
            </Box>
            <FormGroup>
                <FormControlLabel control={<Switch checked={props.fixedOnly} onClick={toggleFixedOnly} />} label="Only show vulnerabilities that have fixes" />
            </FormGroup>
        </Box>
    );
}

