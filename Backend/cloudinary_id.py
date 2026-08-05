import os

def extract_public_id(image_url: str) -> str | None:

    if not image_url:
        return None

    try:
        parts = image_url.split('/')
        upload_index = parts.index('upload')

        path_parts = parts[upload_index + 1:]
        if path_parts[0].startswith('v') and path_parts[0][1:].isdigit():
            path_parts = path_parts[1:]

        file_name_with_ext = "/".join(path_parts)
        public_id, _ = os.path.splitext(file_name_with_ext)

        return public_id
    except ValueError:
        return None