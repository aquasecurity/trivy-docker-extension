import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

export function Loading(props: any) {

    return (
        <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={props.showLoading}        >
            <CircularProgress color="inherit" />
        </Backdrop>)
};