<script lang="ts">
    import ClaudeWordmark from "../../../../components/ClaudeWordmark.svelte";
    import Account from "./account/Account.svelte";
    import Notifications from "./Notifications.svelte";
    import {listen} from "../../../../integration/ws";
    import type {
        AccountManagerAdditionEvent,
        AccountManagerLoginEvent,
        AccountManagerMessageEvent
    } from "../../../../integration/events";
    import {notification} from "./notification_store";

    listen("accountManagerAddition", (e: AccountManagerAdditionEvent) => {
        if (!e.error) {
            notification.set({
                title: "AltManager",
                message: `Successfully added account ${e.username}`,
                error: false
            });
        } else {
            notification.set({
                title: "AltManager",
                message: e.error,
                error: true
            });
        }
    });

    listen("accountManagerMessage", (e: AccountManagerMessageEvent) => {
        notification.set({
            title: "AltManager",
            message: e.message,
            error: false
        });
    });

    listen("accountManagerLogin", (e: AccountManagerLoginEvent) => {
        if (!e.error) {
            notification.set({
                title: "AltManager",
                message: `Successfully logged in to account ${e.username}`,
                error: false
            });
        } else {
            notification.set({
                title: "AltManager",
                message: e.error,
                error: true
            });
        }
    });
</script>

<div class="header">
    <div class="logo-wrapper">
        <ClaudeWordmark size={46} tagText="Client"/>
    </div>

    <Notifications/>

    <Account/>
</div>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 34px;
    padding-bottom: 18px;
    border-bottom: 1px solid color-mix(in srgb, var(--claude-text) 5.5%, transparent);
    align-items: center;
  }

  .logo-wrapper {
    display: grid;
  }
</style>
