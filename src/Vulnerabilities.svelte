<script>
  import { slide } from "svelte/transition";

  function expandDetail() {
    let vulnIndex = this.getAttribute("vulnerability");
    vulnerabilities[vulnIndex].visible = !vulnerabilities[vulnIndex].visible;
  }

  export let vulnerabilities;
</script>

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

    {#if v.title}
      <div class="title-label">{v.title}</div>
    {:else}
      <div class="title-label">{v.pkgName}</div>
    {/if}

    {#if v.fixedVersion !== ""}
      <div class="fix-label">
        <div class="fix-version">Fix Available</div>
      </div>
    {/if}
  </button>
  {#if v.visible}
    <div class="content" transition:slide>
      <table class="fulltable">
        <tr>
          <td class="description" colspan="2">{v.description}</td>
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
              on:click={window.ddClient.openExternal(v.primaryURL)}
              >{v.primaryURL}</span
            ></td
          >
        </tr>
      </table>
    </div>
  {/if}
{/each}

<style>
  button.collapsible:nth-of-type(odd) {
    background-color: #e6eaec;
  }

  button.collapsible:nth-of-type(even) {
    background-color: white;
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
    min-width: 180px;
    margin-top: 5px;
  }

  .fix-label {
    float: right;
    width: 180px;
    min-width: 180px;
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
    min-width: 120px;
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
</style>
