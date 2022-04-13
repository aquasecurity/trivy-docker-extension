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
    const [scanTriggered, setScanTriggered] = React.useState(false);
    const [loaded, setLoaded] = React.useState(false);
    const [images, setImages] = React.useState<string[]>([]);
    const loading = open && !loaded;
    const ignoredImages = ["aquasec/trivy", "trivy-docker-extension"];


    React.useEffect(() => {
        let active = true;

        if (!loading) {
            setImages([]);
            return;
        }

        (async () => {
            if (active) {
                setLoaded(true);
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
                setImages([]);
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

            if (listImages.length == 0) {

            }

            setImages(listImages);
        })
    }

    const triggerScan = () => {
        // disable the scan button as a priority
        props.setSBOMOutput(false);
        props.setDisableScan(true);
        setScanTriggered(true);
    }

    React.useEffect(() => {
        if (scanTriggered && !props.SBOMOutput && props.scanImage !== "") {
            props.runScan();
            setScanTriggered(false);
        }
    }, [scanTriggered]);

    const toggleFixedOnly = () => {
        props.imageUpdated();
        props.setFixedOnly(!props.fixedOnly);
    }
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        props.setDisableScan(false);
        switch (event.key) {
            case "Tab": {
                handleChange(event, event.currentTarget.value);
                break;
            }
            default:
        }
    };

    const handleChange = (e: React.ChangeEvent<{}>, obj: string) => {
        props.imageUpdated();
        props.setScanImage(obj);
        if (obj && obj !== "No images found") {
            props.setDisableScan(false);
        } else {
            props.setDisableScan(true);
        }
    }

    const handleInputChange = (e: React.SyntheticEvent<{}>, obj: string) => {
        props.imageUpdated();
        props.setScanImage(obj);
        if (obj && obj !== "No images found") {
            props.setDisableScan(false);
        } else {
            props.setDisableScan(true);
        }
    }


    return (
        <Box width={props.width} minWidth='450px'>
            <Box display='flex'>
                <Autocomplete sx={{ flexGrow: 1 }}
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
                    loading={loading}
                    noOptionsText="No local images found"
                    renderInput={(params) => {
                        params.inputProps.onKeyDown = handleKeyDown;
                        return (<TextField
                            {...params}
                            placeholder="Select image or type name here..."
                        />);
                    }
                    }
                    onChange={handleChange}
                    onInputChange={handleInputChange}
                />

                <Button sx={{ marginLeft: '3px' }}
                    variant="contained"
                    disabled={props.disableScan}
                    onClick={triggerScan}>
                    Scan Image
                </Button>
            </Box>
            <FormGroup row sx={{ display: 'flex' }}>
                <FormControlLabel control={<Switch checked={props.fixedOnly} onClick={toggleFixedOnly} />} label="Only show vulnerabilities that have fixes" />
            </FormGroup>
        </Box>
    );
}
