import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 1. Initialize Django ASGI App FIRST
django_asgi_app = get_asgi_application()

# 2. Now import the routing (which uses models)
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chat.routing 

application = ProtocolTypeRouter({
    "http": django_asgi_app, # Use the variable we created above
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
        
    ),
})