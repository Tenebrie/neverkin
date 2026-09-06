---
title: 'Privacy Policy'
layout: '~/layouts/MarkdownLayout.astro'
---

_Last updated_: September 2026

## Introduction

This Privacy Policy describes how the Neverkin app ("Service") collects, uses, and protects your information. Neverkin is an open-source project committed to transparency and user privacy.

## Information We Collect

### Account Information

When you create an account, we collect:

- Email address
- Password
- Username

If you sign in with Google, we receive your email address and display name.

### Handling of Data

Neverkin **does**:
- Use cookies to handle user authentication (JWT token)
- Store the data you create
- Process and serve the data you request or work with
- Load data from external sources (Google Fonts, Iconify)
- Keep database backups

Neverkin **does not**:
- Sell your data
- Use it as data for training AI models
- Use analytics or advertising trackers
- Host any third-party cookies, ads or tracking libraries
- Share your data with third parties, except as described in "Third-Party Services" below

The administrative accounts are able to open and modify your worlds. The administration **will not** look at or process your data unless you provide an explicit permission for a specific purpose.

### Technical Logs

When you use Neverkin, we collect your IP address to limit excessive requests from malicious users. We also record what kind of actions you take (i.e. account creation, login). Our reverse proxy also keeps standard access logs containing IP addresses and requested URLs. All of that information is stored up to 60 days and is never shared.

## Third-Party Services

- MCP integration: You may optionally connect Neverkin to an AI agent through the MCP integration. When you do, the content of the worlds you access through it (actors, events, articles, tags) is sent to your agent on your request. This only happens for accounts that have explicitly authorized the connection. Access tokens expire after 24 hours.
- Contact form: Messages sent through the contact form, including your name, email address and message, are delivered to us through a Discord webhook.
- Hosting: The Service and its backups are hosted on DigitalOcean.

## Data Retention

When you delete your account, your account and all data you created are removed from the live database within a minute. Encrypted database backups are retained on a rolling schedule and may contain a copy of your data for up to three years after deletion. Backups are only used to restore the service after data loss and are not used to recover individual accounts.

## Your Rights

You have the right to:

- Access all content you've created
- Delete your account and associated data
- Control who can access your worlds through permission settings
- Export the worlds and calendars you have created

## Open Source Transparency

Neverkin is open source under the GPL-3.0 license. You can review exactly how your data is handled by examining the [source code](https://github.com/tenebrie/neverkin). You may also self-host the Service if you prefer full control over your data.

## Children's Privacy

The Service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected by updating the "Last updated" date above.

## Contact

For privacy-related questions, please [get in touch](/contact) or open an issue on the [GitHub repository](https://github.com/tenebrie/neverkin).
