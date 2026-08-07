# General Project Rules

- **Automated Deployments:** Always run `git add .`, `git commit -m "..."`, and `git push` to the main branch immediately after resolving a bug or completing a task, unless the user explicitly mentions otherwise. This is necessary because the deployment is handled via GitHub Actions on push, and the EC2 server loads everything fresh according to the newest push.
