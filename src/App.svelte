<script>
    import Loading from "./Loading.svelte";

    import { slide } from "svelte/transition";

    const ignoredImages = ["aquasec/trivy", "trivy-docker-extension"];

    let imagesPromise = getImages();

    async function getImages() {
        let images = [];
        try {
            images = await window.ddClient.docker.listImages();
        } catch (images) {
            return images;
        }
        return images
            .map((images) => images.RepoTags)
            .sort()
            .filter((images) => images && "<none>:<none>" !== images[0])
            .filter((images) => {
                for (let i = 0; i < ignoredImages.length; i++) {
                    if (images[0].startsWith(ignoredImages[i])) {
                        return false;
                    }
                }
                return true;
            })
            .flat();
    }

    class TrivyVulnerability {
        constructor(v) {
            this.id = v.VulnerabilityID;
            this.title = v.Title;
            this.severity = v.Severity;
            this.severityClass = v.Severity.toLowerCase();
            this.description = v.Description;
            this.pkgName = v.PkgName;
            this.installedVersion = v.InstalledVersion
                ? v.InstalledVersion
                : "";
            this.fixedVersion = v.FixedVersion ? v.FixedVersion : "";
            this.references = v.References;
            this.primaryURL = v.PrimaryURL;
            this.visible = false;

            incrementCounter(v.Severity);
        }
    }

    const getSeverityOrdering = (severity) => {
        switch (severity) {
            case "CRITICAL":
                return 0;
            case "HIGH":
                return 1;
            case "MEDIUM":
                return 2;
            case "LOW":
                return 3;
            case "UNKNOWN":
                return 4;
        }
    };

    async function createCacheVolume() {
        const createCacheCmd = `volume create trivycache`;
        console.log(createCacheCmd);

        var success = true;

        await window.ddClient.docker.cli
            .exec("volume", ["create", "trivycache"])
            .then((result) => {
                if (result.stderr !== "") {
                    success = false;
                }
            });
        return success;
    }

    async function triggerTrivy() {
        resetCounters();

        var loadingOverlay = document.querySelector(".loading");
        loadingOverlay.classList.remove("hidden");

        await createCacheVolume().then((created) => {
            if (!created) {
                loadingOverlay.classList.add("hidden");
                console.log("failed to create volume");
                return;
            }
        });

        let stdout = "";
        let stderr = "";
        await window.ddClient.docker.cli.exec(
            "run",
            [
                "--rm",
                "-v",
                "/var/run/docker.sock:/var/run/docker.sock",
                "-v",
                "trivycache:/root/.cache",
                "aquasec/trivy",
                "--quiet",
                "image",
                "-f=json",
                selected,
            ],
            {
                stream: {
                    onOutput(data) {
                        stdout += data.stdout;
                        if (data.stderr) {
                            stderr += data.stderr;
                        }
                    },
                    onError(error) {
                        window.ddClient.desktopUI.toast.error(
                            `An error occurred while scanning ${selected}`
                        );
                        console.error(error);
                    },
                    onClose(exitCode) {
                        if (exitCode === 0) {
                            window.ddClient.desktopUI.toast.success(
                                `Scan of ${selected} completed successfully`
                            );
                            var res = { stdout: stdout, stderr: stderr };
                            processResult(res);
                        } else {
                            window.ddClient.desktopUI.toast.error(
                                `An error occurred while scanning ${selected}`
                            );
                        }
                    },
                },
            }
        );
    }

    function processResult(res) {
        noErrors = false;
        document.querySelector(".loading").classList.add("hidden");

        let vulns = [];
        if (res.stderr !== "") {
            return;
        }

        var results = JSON.parse(res.stdout);

        if (results.Results === undefined) {
            vulnerabilities = [];
            noErrors = true;
            return;
        }
        for (let i = 0; i < results.Results.length; i++) {
            let r = results.Results[i];
            if (r.Vulnerabilities === undefined) {
                continue;
            }
            for (let j = 0; j < r.Vulnerabilities.length; j++) {
                let v = r.Vulnerabilities[j];
                vulns.push(new TrivyVulnerability(v));
            }
        }

        vulns.sort((a, b) => {
            if (
                getSeverityOrdering(a.severity) ===
                getSeverityOrdering(b.severity)
            ) {
                return a.id >= b.id ? 1 : -1;
            }
            return getSeverityOrdering(a.severity) >=
                getSeverityOrdering(b.severity)
                ? 1
                : -1;
        });

        console.log(vulns);
        allVulnerabilities = vulns;
        filterSeverity("all");
        if (vulnerabilities.length === 0) {
            noErrors = true;
        }
    }

    function filterSeverity(severity) {
        if (severity === "all") {
            vulnerabilities = allVulnerabilities;
            return;
        }
        const filtered = allVulnerabilities.filter(
            (v) => v.severity == severity
        );

        vulnerabilities = filtered;
    }

    function expandDetail() {
        let vulnIndex = this.getAttribute("vulnerability");
        vulnerabilities[vulnIndex].visible =
            !vulnerabilities[vulnIndex].visible;
    }

    function imageChanged() {
        noErrors = false;
    }

    function resetCounters() {
        all = 0;
        critical = 0;
        high = 0;
        medium = 0;
        low = 0;
        unknown = 0;
    }

    function incrementCounter(severity) {
        all += 1;
        switch (severity) {
            case "CRITICAL":
                critical += 1;
                return;
            case "HIGH":
                high += 1;
                return;
            case "MEDIUM":
                medium += 1;
                return;
            case "LOW":
                low += 1;
                return;
            case "UNKNOWN":
                unknown += 1;
                return;
        }
    }

    let all;
    let critical;
    let high;
    let medium;
    let low;
    let unknown;

    let selected;
    let allVulnerabilities = [];
    let vulnerabilities = [];
    let noErrors = false;
</script>

<main>
    <div class="header">
        <img src="./build/images/trivy.svg" alt="Trivy Logo" height="120px" />
        <label class="top-label" for="images"
            >Select an image to scan with Trivy</label
        >

        <select
            class="imagelist"
            aria-placeholder="Image Name"
            bind:value={selected}
            on:change={imageChanged}
        >
            {#await imagesPromise}
                <option>Loading images</option>
            {:then foundImages}
                <option />
                {#each foundImages as image}
                    <option>{image}</option>
                {/each}
            {:catch error}
                <option>{error}</option>
            {/await}
        </select>
        <button class="scan" on:click={triggerTrivy}>Scan</button>
    </div>

    <Loading />
    <div class="container">
        {#if vulnerabilities.length > 0}
            <div class="severity-buttons">
                {#if all > 0}<div
                        class="severity-button "
                        on:click={() => filterSeverity("all")}
                    >
                        <div class="box all" />
                        All: {all}
                    </div>{/if}
                {#if critical > 0}<div
                        class="severity-button "
                        on:click={() => filterSeverity("CRITICAL")}
                    >
                        <div class="box critical" />
                        Critical: {critical}
                    </div>{/if}
                {#if high > 0}<div
                        class="severity-button high"
                        on:click={() => filterSeverity("HIGH")}
                    >
                        <div class="box high" />
                        High: {high}
                    </div>{/if}
                {#if medium > 0}<div
                        class="severity-button "
                        on:click={() => filterSeverity("MEDIUM")}
                    >
                        <div class="box medium" />
                        Medium: {medium}
                    </div>{/if}
                {#if low > 0}<div
                        class="severity-button "
                        on:click={() => filterSeverity("LOW")}
                    >
                        <div class="box low" />
                        Low: {low}
                    </div>{/if}
                {#if unknown > 0}<div
                        class="severity-button "
                        on:click={() => filterSeverity("UNKNOWN")}
                    >
                        <div class="box unknown" />
                        Unknown: {unknown}
                    </div>{/if}
            </div>
        {/if}

        {#each vulnerabilities as v, index (v)}
            <button
                type="button"
                class="collapsible"
                vulnerability={index}
                on:click={expandDetail}
            >
                <div class="severity-label">
                    <div class="severity-pill {v.severityClass}">
                        {v.severity}
                    </div>
                </div>
                <div class="id-label">{v.id}</div>

                <div class="title-label">{v.title}</div>
                {#if v.fixedVersion !== ""}
                    <div class="fix-label">
                        <div class="fix-version">Fixed Available</div>
                    </div>
                {/if}
            </button>
            {#if v.visible}
                <div class="content" transition:slide>
                    <table class="fulltable">
                        <tr>
                            <td class="description" colspan="2"
                                >{v.description}</td
                            >
                        </tr>
                        <tr>
                            <td class="detailheading">Package Name:</td>
                            <td>{v.pkgName}</td>
                        </tr>
                        <tr>
                            <td class="detailheading">Installed Version:</td>
                            <td>{v.installedVersion}</td>
                        </tr>
                        <tr>
                            <td class="detailheading">Fixed Version:</td>
                            <td>{v.fixedVersion}</td>
                        </tr>
                        <tr>
                            <td class="detailheading">More information:</td>
                            <td
                                ><span
                                    class="link"
                                    on:click={window.ddClient.openExternal(
                                        v.primaryURL
                                    )}>{v.primaryURL}</span
                                ></td
                            >
                        </tr>
                        <!-- <tr>
                        <td class="detailheading">References:</td>
                        <td
                            ><ul class="links">
                                {#each v.references as reference}
                                    <li class="link-item">
                                        <a href={reference}>{reference}</a>
                                    </li>
                                {/each}
                            </ul>
                        </td>
                    </tr> -->
                    </table>
                </div>
            {/if}
        {/each}
    </div>
    {#if noErrors}
        <div class="noerrors">
            <h2>No errors where found with {selected}</h2>
        </div>
    {/if}
</main>

<style>
    main {
    }

    .header {
        background-image: url("images/trivy.png");
        background-size: cover;
        background-position: center;
        padding: 30px;
        padding-top: 200px;
        padding-bottom: 220px;
    }

    h1 {
        font-family: "Droplet";
        font-size: 36pt;
        font-weight: 500;
        color: white;
    }

    .imagelist {
        font-size: 16px;
        height: 40px;
    }

    .container {
        background-color: #e6eaec;
    }

    button.scan {
        flex-direction: row;
        align-items: center;
        padding: 8px;

        width: 86px;
        height: 40px;

        background: #08b1d5;
        color: white;
        border-style: none;

        font-weight: 700;
        font-size: 16px;
        border-radius: 4px;
    }

    button.collapsible:nth-of-type(odd) {
        background-color: #e6eaec;
    }

    button.collapsible:nth-of-type(even) {
        background-color: white;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }

    .severity-pill {
        border-radius: 4px;
        padding: 5px;
        text-transform: uppercase;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        width: 80px;
    }

    .severity-pill.critical {
        background-color: red;
        color: #fff;
    }

    .severity-pill.high {
        background-color: orangered;
        color: #fff;
    }

    .severity-pill.medium {
        background-color: orange;
        color: #fff;
    }

    .severity-pill.low {
        background-color: #666;
        color: #fff;
    }

    .severity-pill.unknown {
        background-color: #666;
        color: #fff;
    }

    .collapsible {
        color: black;
        cursor: pointer;
        padding: 18px;
        width: 100%;
        text-align: left;
        outline: none;
        font-size: 15px;
        display: flex;
        border: none;
    }

    .top-label {
        color: white;
        padding-bottom: 10px;
    }

    .detailheading {
        font-weight: bold;
        vertical-align: top;
        width: 150px;
    }

    .description {
        font-style: italic;
        padding-bottom: 8px;
        line-height: 1.6em;
    }

    .links {
        padding-inline-start: 0;
        margin-block-start: 0;
    }

    .link {
        list-style-type: none;
        padding-bottom: 3px;
        cursor: pointer;
        color: #08b1d5;
    }

    .content {
        overflow: hidden;
        background-color: #fff;
        padding: 16px;
        border-bottom: 1px solid grey;
    }

    .id-label {
        width: 180px;
        margin-top: 5px;
    }

    .fix-label {
        float: right;
        width: 180px;
        margin-top: 5px;
        font-weight: bold;
    }

    .fix-version {
        border-radius: 4px;
        padding: 5px;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        width: 150px;
        background-color: #405a75;
        color: white;
    }

    .title-label {
        flex-grow: 1;
        margin-top: 5px;
    }

    .severity-label {
        width: 120px;
        text-align: center;
    }

    .fulltable.critical {
        padding-left: 16px;
        border-left: 8px solid red;
    }

    .fulltable.high {
        padding-left: 16px;
        border-left: 8px solid orangered;
    }

    .fulltable.medium {
        padding-left: 16px;
        border-left: 8px solid orange;
    }

    .fulltable.low {
        padding-left: 16px;
        border-left: 8px solid #666;
    }

    .fulltable.unknown {
        padding-left: 16px;
        border-left: 8px solid #666;
    }

    .noerrors {
        width: 100%;
        text-align: center;
        vertical-align: middle;
        padding-top: 10%;
    }

    .noerrors.h2 {
        font-weight: 500;
        font-size: 24px;
        font-family: "Open Sans";
    }

    .severity-buttons {
        padding: 16px;
        display: block;
    }

    .severity-button {
        border-radius: 4px;
        padding: 5px;
        text-transform: capitalize;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        width: 120px;
        float: left;
        margin-right: 20px;
        cursor: pointer;
        display: inline-block;
        border: 2px solid #405a75;
    }
    /* 
    .severity-button.critical {
        border: 2px solid red;
    }

    .severity-button.high {
        border: 2px solid orangered;
    }

    .severity-button.medium {
        border: 2px solid orange;
    }

    .severity-button.low {
        border: 2px solid #666;
    }

    .severity-button.unknown {
        border: 2px solid #666;
    }

    .severity-button.all {
        border: 2px solid #405a75;
    } */

    .box {
        float: left;
        height: 20px;
        width: 8px;
        clear: both;
    }

    .box.critical {
        background-color: red;
    }

    .box.high {
        background-color: orangered;
    }

    .box.medium {
        background-color: orange;
    }

    .box.low {
        background-color: #666;
    }

    .box.unknown {
        background-color: #666;
    }

    .box.all {
        background-color: #00ffe4;
    }
</style>
