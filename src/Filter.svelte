<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function filterSeverity(severity) {
    selected = severity;
    dispatch("filter", {
      severity: severity,
    });
  }

  let selected = "all";
  export let all;
  export let critical;
  export let high;
  export let medium;
  export let low;
  export let unknown;
</script>

<div class="severity-buttons">
  {#if all > 0}<div
      class="severity-button {selected === 'all' ? 'selected' : ''}"
      on:click={() => filterSeverity("all")}
    >
      <div class="box all" />
      All: {all}
    </div>{/if}
  {#if critical > 0}<div
      class="severity-button {selected === 'CRITICAL' ? 'selected' : ''}"
      on:click={() => filterSeverity("CRITICAL")}
    >
      <div class="box critical" />
      Critical: {critical}
    </div>{/if}
  {#if high > 0}<div
      class="severity-button {selected === 'HIGH' ? 'selected' : ''}"
      on:click={() => filterSeverity("HIGH")}
    >
      <div class="box high" />
      High: {high}
    </div>{/if}
  {#if medium > 0}<div
      class="severity-button {selected === 'MEDIUM' ? 'selected' : ''}"
      on:click={() => filterSeverity("MEDIUM")}
    >
      <div class="box medium" />
      Medium: {medium}
    </div>{/if}
  {#if low > 0}<div
      class="severity-button {selected === 'LOW' ? 'selected' : ''}"
      on:click={() => filterSeverity("LOW")}
    >
      <div class="box low" />
      Low: {low}
    </div>{/if}
  {#if unknown > 0}<div
      class="severity-button {selected === 'UNKNOWN' ? 'selected' : ''}"
      on:click={() => filterSeverity("UNKNOWN")}
    >
      <div class="box unknown" />
      Unknown: {unknown}
    </div>{/if}
</div>

<style>
  .severity-buttons {
    padding: 16px;
    padding-bottom: 24px;
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
    /* float: left; */
    margin-right: 20px;
    cursor: pointer;
    display: inline-block;
    border: 2px solid #405a75;
    background: #405a75;
    color: white;
  }

  .severity-button.selected {
    border: 2px solid #ff445f;
    background: #405a75;
  }

  .box {
    float: left;
    height: 18px;
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
