import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Box } from "@mui/system";


export function VulnsFilter(props: any) {
    return (<Box sx={{ m: '0.5rem' }}>
        <ToggleButtonGroup
            value={props.severityFilter}
            exclusive
            onChange={props.triggerFilter}
            sx={{ marginLeft: '1.5rem', marginTop: '1.5rem', marginBottom: '0.8rem', marginRight: '1.5rem', display: props.showFilter }}
        >
            <ToggleButton value="all" >All ({props.all})</ToggleButton>
            <ToggleButton value="critical" disabled={props.critical === 0}
                sx={{ borderBottom: '2px solid red' }} >
                Critical ({props.critical})</ToggleButton>
            <ToggleButton value="high" disabled={props.high === 0}
                sx={{ borderBottom: '2px solid orangered' }} >
                High ({props.high})</ToggleButton>
            <ToggleButton value="medium" disabled={props.medium === 0}
                sx={{ borderBottom: '2px solid orange' }} >
                Medium ({props.medium})</ToggleButton>
            <ToggleButton value="low" disabled={props.low === 0}
                sx={{ borderBottom: '2px solid gray' }} >
                Low ({props.low})</ToggleButton>
            <ToggleButton value="unknown" disabled={props.unknown === 0}
                sx={{ borderBottom: '2px solid whitesmoke' }} >
                Unknown ({props.unknown})</ToggleButton>

        </ToggleButtonGroup>
    </Box >)
}