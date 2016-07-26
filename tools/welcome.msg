Welcome to the digidoc server

Use the following commands to start the digidoc and the sapplies application
sudo start proxy
sudo start digidoc
sudo start sapplies

And to stop the digidoc
sudo stop digidoc
sudo stop sapplies
sudo stop proxy

These start and stop commands are configured in the upstart scripts:
proxy: /etc/init/proxy.conf
digidoc: /etc/init/digidoc.conf

The mongodb database is backupped to a dropbox account every night at 4, by a crontab running the following script:
/home/maarten/mongobackup.sh


