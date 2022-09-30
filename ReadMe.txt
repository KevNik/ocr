Coloque a pasta do script em C:\ocr

Instalação:
    1. Instale o node.js (16.16.0) e postgres (9.1) no windows

    2. Abra a linha de comando do node.js, entre na pasta do projeto e instale os módulos do script com o comando:
        npm install

    3. Copie o arquivo ".env.example" para outro com o nome ".env" e altere as configurações de acordo
        cp .env.example .env

    4. Para instalar o script como um serviço no windows execute o script service-install.bat (Verifique o arquivo antes de rodar)

Obs: Para remover o serviço rode o script service-remove.bat


Crie essas colunas no banco:

ALTER TABLE tobackup.t_log ADD horario_de_envio timestamp NULL;
ALTER TABLE tobackup.t_log ADD codigo_retornado varchar NULL;
ALTER TABLE tobackup.t_log ADD tentativa_de_envio timestamp NULL;
ALTER TABLE tobackup.t_image add data_e_hora_do_envio timestamp null;
ALTER TABLE tobackup.t_image add data_e_hora_tentativdo_envio timestamp null;