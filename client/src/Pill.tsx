import Chip from "@mui/material/Chip";

export function Pill(props: any) {

    const getSeverity = (severity: string): string => {
        switch (severity) {
            case "CRITICAL":
                return "red";
            case "HIGH":
                return "orangered";
            case "MEDIUM":
                return "orange";
            case "LOW":
                return "gray";
            default:
                return "gray";
        }
    }

    return (
        <Chip
            label={props.item.severity}
            sx={{
                borderRadius: '4px',
                fontSize: '.8rem',
                fontWeight: 600,
                padding: '2px',
                width: '100px',
                minWidth: '100px',
                bgcolor: getSeverity(props.item.severity),
                color: 'white',
                marginRight: '1rem',
            }} />
    )
}
